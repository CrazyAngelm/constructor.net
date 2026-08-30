import { getDefaultHandler } from '@/lib/api/apiHandler'
import { responseAuth } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
import { Prisma } from '@prisma/client'
import { previewExternalFlowError, previewExternalFlowsRestricted } from '@/lib/preview'
const prisma = getPrisma()
const handler = getDefaultHandler()
const addDays = (date: Date, days: number): Date => {
	return new Date(date.setDate(date.getDate() + days))
}
handler.post(
	responseAuth(async (_req, _res, userId) => {
		if (previewExternalFlowsRestricted()) return { error: previewExternalFlowError }
		const result = await prisma
			.$transaction(async (tx: Prisma.TransactionClient) => {
				const existed = await tx.subscription.findFirst({
					where: { userId },
				})
				if (existed)
					throw { code: 409, message: 'Trial subscription already exists' }
				const license = await tx.license.findUnique({
					where: { id: 1 },
				})
				if (!license) throw { code: 404, message: 'License not found' }
				const end = addDays(new Date(), license.duration)
				await tx.subscription.create({
					data: {
						userId,
						licenseId: 1,
						active: true,
						startDate: new Date(),
						endDate: end,
						paymentToken: null,
						courses: await getCourses(tx, 1),
						canceled: false,
					},
				})
				return {}
			})
			.catch(e => ({ error: e?.code ? e : { code: 500 } }))
		return 'error' in result ? result : { response: result }
	})
)
const getCourses = async (
	tx: Prisma.TransactionClient,
	licenseId: number
): Promise<string> => {
	const license = await tx.license.findUnique({ where: { id: licenseId } })
	const licenseCourses = license?.courses
		? (JSON.parse(license.courses) as number[])
		: []
	const courses = await tx.course.findMany({
		where: {
			id: {
				notIn: licenseCourses,
			},
			deleted: false,
		},
	})
	return JSON.stringify(
		courses.slice(0, license?.freeCourses ?? 0).map(p => p.id)
	)
}
export default handler
