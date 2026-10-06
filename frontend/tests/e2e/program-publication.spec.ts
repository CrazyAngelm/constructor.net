import { expect, test, type APIRequestContext } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { assertPreviewDatabase } from '../../scripts/preview-guard'
import { catalogTaskToSheetItem, emptyStudioSheet } from '../../lib/studio/types'

async function login(request: APIRequestContext, email: string, password: string) {
	const csrf = await (await request.get('/api/auth/csrf')).json()
	await request.post('/api/auth/callback/credentials', { form: { csrfToken: csrf.csrfToken, email, password, json: 'true' } })
	expect((await (await request.get('/api/auth/session')).json()).user).toBeTruthy()
}

test('old programs are retained but are not automatically published in the new library', async ({ page }) => {
	test.slow() // Authentication and database checks use the isolated remote preview.
	test.skip(!process.env.PUBLICATION_E2E_DATABASE_URL || !process.env.PREVIEW_ADMIN_EMAIL, 'Requires isolated preview database')
	const prisma = new PrismaClient({ datasourceUrl: process.env.PUBLICATION_E2E_DATABASE_URL! })
	let courseId = 0, legacyId = ''
	try {
		await assertPreviewDatabase(prisma)
		await login(page.request, process.env.PREVIEW_ADMIN_EMAIL!, process.env.PREVIEW_ADMIN_PASSWORD!)
		const course = await prisma.course.create({ data: { name: `Архивная программа ${randomUUID()}`, description: '', visible: true } })
		courseId = course.id
		const original = await prisma.worklist.create({ data: { name: course.name, json: '{}' } })
		legacyId = original.id
		await prisma.courseToWorklist.create({ data: { courseId, worklistId: legacyId } })
		const response = await page.request.get('/api/studio/programs')
		expect(response.ok()).toBeTruthy()
		const { programs } = await response.json() as { programs: Array<{ id: string }> }
		expect(programs.some(item => item.id === `legacy:${legacyId}`)).toBe(false)
		expect(await prisma.worklist.findUnique({ where: { id: legacyId } })).toEqual(original)
		// Compatibility with the old application remains available to authorized users.
		expect((await page.request.get(`/api/worklist/${legacyId}`)).status()).toBe(200)
	} finally {
		if (legacyId) {
			await prisma.courseToWorklist.deleteMany({ where: { worklistId: legacyId } })
			await prisma.worklist.delete({ where: { id: legacyId } })
		}
		if (courseId) await prisma.course.delete({ where: { id: courseId } })
		await prisma.$disconnect()
	}
})

test('published program is entitled, editable only as a copy, and retains its uploaded image after unpublishing', async ({ page, playwright }) => {
	// Browser/API/SSH round trips take longer than Playwright's default 30s.
	test.slow()
	test.skip(!process.env.PUBLICATION_E2E_DATABASE_URL || !process.env.PREVIEW_ADMIN_EMAIL, 'Requires isolated preview database')
	const prisma = new PrismaClient({ datasourceUrl: process.env.PUBLICATION_E2E_DATABASE_URL! })
	const suffix = randomUUID()
	const password = randomUUID()
	const email = `program-${suffix}@preview.labstudio.invalid`
	const student = await playwright.request.newContext({ baseURL: process.env.E2E_BASE_URL })
	const outsider = await playwright.request.newContext({ baseURL: process.env.E2E_BASE_URL })
	let userId = '', outsiderId = '', worklistId = '', courseId = 0
	try {
		await assertPreviewDatabase(prisma)
		await login(page.request, process.env.PREVIEW_ADMIN_EMAIL!, process.env.PREVIEW_ADMIN_PASSWORD!)
		const course = await prisma.course.create({ data: { name: `Программа ${suffix}`, description: '', visible: true } })
		courseId = course.id
		const license = await prisma.license.findFirstOrThrow({ where: { id: 6 } })
		const user = await prisma.user.create({ data: { email, password: await hash(password, 12), emailVerified: new Date() } })
		userId = user.id
		await prisma.subscription.create({ data: { userId, licenseId: license.id, courses: JSON.stringify([courseId]), active: true, canceled: false, endDate: null } })
		const other = await prisma.user.create({ data: { email: `other-${email}`, password: await hash(password, 12), emailVerified: new Date() } })
		outsiderId = other.id
		await prisma.subscription.create({ data: { userId: other.id, licenseId: license.id, courses: '[]', active: true, canceled: false, endDate: null } })
		await login(student, email, password); await login(outsider, `other-${email}`, password)
		const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
		const upload = await page.request.post('/api/studio/uploads', { multipart: { file: { name: 'program.png', mimeType: 'image/png', buffer: png } } })
		expect(upload.ok()).toBeTruthy()
		const image = (await upload.json()).url
		const sheet = emptyStudioSheet()
		sheet.data.items.push(catalogTaskToSheetItem({ id: 1, name: 'Задание программы', description: 'Исходный текст', instruction: 'Хлопай', complexity: null, image }, suffix))
		const create = await page.request.post('/api/studio/worklists', { data: { name: course.name, courseId, teacherSheet: sheet, studentSheet: emptyStudioSheet() } })
		expect(create.ok()).toBeTruthy(); worklistId = (await create.json()).id
		const list = async (request: APIRequestContext) => (await (await request.get('/api/studio/programs')).json()).programs as Array<{ id: string }>
		expect((await list(student)).some(p => p.id === worklistId)).toBe(false)
		expect((await student.post(`/api/studio/worklists/${worklistId}/duplicate`)).status()).toBe(404)
		await page.goto('/studio')
		await page.getByRole('button', { name: 'Мои конспекты', exact: true }).first().click()
		const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: course.name, exact: true }) })
		page.on('dialog', dialog => dialog.accept())
		await card.getByRole('button', { name: 'Опубликовать конспект', exact: true }).click()
		await expect(card).toContainText('Опубликован')
		expect((await list(student)).some(p => p.id === worklistId)).toBe(true)
		expect((await list(outsider)).some(p => p.id === worklistId)).toBe(false)
		expect((await outsider.post(`/api/studio/worklists/${worklistId}/duplicate`)).status()).toBe(404)
		expect((await student.patch(`/api/studio/worklists/${worklistId}/publication`, { data: { published: false } })).status()).toBe(403)
		expect((await student.put(`/api/studio/worklists/${worklistId}`, { data: { name: 'Чужое изменение' } })).status()).toBe(404)
		await login(page.request, email, password)
		await page.goto('/studio')
		await page.getByRole('button', { name: 'Программы LabStudio', exact: true }).first().click()
		const program = page.getByRole('article').filter({ has: page.getByRole('heading', { name: course.name, exact: true }) })
		await program.getByRole('button', { name: 'Открыть свою копию' }).click()
		await expect(page.getByLabel('Название конспекта', { exact: true })).toHaveValue(`Копия: ${course.name}`)
		const copy = (await prisma.studioWorklist.findFirstOrThrow({ where: { ownerId: userId } }))
		expect(copy.published).toBe(false)
		const copied = JSON.parse(copy.teacherSheet)
		expect(copied.data.items[0].image).not.toBe(image)
		expect((await student.get(copied.data.items[0].image)).status()).toBe(200)
		copied.data.items[0].instruction = 'Своё изменение'
		expect((await student.put(`/api/studio/worklists/${copy.id}`, { data: { teacherSheet: copied } })).ok()).toBeTruthy()
		expect(JSON.parse((await prisma.studioWorklist.findUniqueOrThrow({ where: { id: worklistId } })).teacherSheet).data.items[0].instruction).toBe('Хлопай')
		await login(page.request, process.env.PREVIEW_ADMIN_EMAIL!, process.env.PREVIEW_ADMIN_PASSWORD!)
		expect((await page.request.patch(`/api/studio/worklists/${worklistId}/publication`, { data: { published: false } })).ok()).toBeTruthy()
		expect((await list(student)).some(p => p.id === worklistId)).toBe(false)
		expect((await student.get(copied.data.items[0].image)).status()).toBe(200)
	} finally {
		if (worklistId) await prisma.studioWorklist.deleteMany({ where: { id: worklistId } })
		for (const id of [userId, outsiderId].filter(Boolean)) { await prisma.studioWorklist.deleteMany({ where: { ownerId: id } }); await prisma.subscription.deleteMany({ where: { userId: id } }); await prisma.user.delete({ where: { id } }) }
		if (courseId) await prisma.course.delete({ where: { id: courseId } })
		await student.dispose(); await outsider.dispose(); await prisma.$disconnect()
	}
})
