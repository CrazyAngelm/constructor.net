import { Prisma, PrismaClient } from '@prisma/client'
import { compare, hash } from 'bcryptjs'
import { assertPreviewDatabase, requireEnvironment, requirePreviewConfirmation } from './preview-guard'

const prisma = new PrismaClient()

const integerEnvironment = (name: string): number => {
	const value = Number(requireEnvironment(name))
	if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer`)
	return value
}

const ensureUser = async (tx: Prisma.TransactionClient, email: string, password: string, name: string) => {
	const existing = await tx.user.findUnique({ where: { email } })
	if (!existing) return tx.user.create({ data: { email, name, password: await hash(password, 12), emailVerified: new Date() } })
	if (!existing.password || !(await compare(password, existing.password))) {
		return tx.user.update({ where: { id: existing.id }, data: { name, password: await hash(password, 12), emailVerified: existing.emailVerified ?? new Date() } })
	}
	return existing
}

async function main(): Promise<void> {
	requirePreviewConfirmation('PREVIEW_USER_SEED_CONFIRMED')
	await assertPreviewDatabase(prisma)
	const adminEmail = requireEnvironment('PREVIEW_ADMIN_EMAIL')
	const adminPassword = requireEnvironment('PREVIEW_ADMIN_PASSWORD')
	const demoEmail = requireEnvironment('PREVIEW_DEMO_EMAIL')
	const demoPassword = requireEnvironment('PREVIEW_DEMO_PASSWORD')
	if (adminEmail === demoEmail) throw new Error('PREVIEW_ADMIN_EMAIL and PREVIEW_DEMO_EMAIL must differ')
	const licenseName = requireEnvironment('PREVIEW_LICENSE_NAME')
	const licenseDuration = integerEnvironment('PREVIEW_LICENSE_DURATION_DAYS')
	const freeCourses = integerEnvironment('PREVIEW_LICENSE_FREE_COURSES')

	const [admin, demo] = await prisma.$transaction(async (tx) => {
		const admin = await ensureUser(tx, adminEmail, adminPassword, 'Preview admin')
		const demo = await ensureUser(tx, demoEmail, demoPassword, 'Preview demo')
		const scope = await tx.scope.upsert({ where: { value: 'admin' }, create: { value: 'admin' }, update: {} })
		if (!await tx.scopeJoin.findFirst({ where: { userId: admin.id, scopeId: scope.id } })) await tx.scopeJoin.create({ data: { userId: admin.id, scopeId: scope.id } })
		const license = await tx.license.upsert({ where: { id: 1 }, create: { id: 1, name: licenseName, description: 'Preview-only license', price: 0, duration: licenseDuration, freeCourses, courses: '[]' }, update: { name: licenseName, duration: licenseDuration, freeCourses, price: 0, courses: '[]' } })
		const selectedCourses = JSON.stringify((await tx.course.findMany({ where: { deleted: false }, orderBy: { id: 'asc' }, take: freeCourses, select: { id: true } })).map((course) => course.id))
		const subscription = await tx.subscription.findFirst({ where: { userId: demo.id, licenseId: license.id, canceled: false } })
		if (subscription) await tx.subscription.update({ where: { id: subscription.id }, data: { active: true, startDate: subscription.startDate, endDate: null, courses: selectedCourses, canceled: false, paymentToken: null, paymentTitle: null } })
		else await tx.subscription.create({ data: { userId: demo.id, licenseId: license.id, active: true, endDate: null, courses: selectedCourses, canceled: false } })
		return [admin, demo]
	})
	console.log(`Seeded preview users: ${admin.email}, ${demo.email}`)
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
}).finally(() => prisma.$disconnect())
