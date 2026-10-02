import { expect, test, type APIRequestContext } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { assertPreviewDatabase } from '../../scripts/preview-guard'

async function login(request: APIRequestContext, email: string, password: string) {
	const csrf = await (await request.get('/api/auth/csrf')).json()
	await request.post('/api/auth/callback/credentials', { form: { csrfToken: csrf.csrfToken, email, password, json: 'true' } })
	expect((await (await request.get('/api/auth/session')).json()).user).toBeTruthy()
}

test('course stays a draft after saving, publishes explicitly and can be hidden again', async ({ page, playwright }) => {
	// Remote browser/API/SSH round trips exceeded Playwright's default 30 seconds.
	test.slow()
	test.skip(!process.env.PUBLICATION_E2E_DATABASE_URL || !process.env.PREVIEW_ADMIN_EMAIL, 'Requires isolated preview database and admin')
	const database = new URL(process.env.PUBLICATION_E2E_DATABASE_URL!)
	if (database.hostname !== '127.0.0.1') throw new Error('Use the isolated preview database tunnel')
	const prisma = new PrismaClient({ datasourceUrl: database.toString() })
	const suffix = randomUUID()
	const name = `Проверка публикации ${suffix}`
	const email = `publication-${suffix}@preview.labstudio.invalid`
	const password = randomUUID()
	const subscriber = await playwright.request.newContext({ baseURL: process.env.E2E_BASE_URL })
	let userId = ''
	let courseId = 0
	let categoryId = 0
	let taskId = 0
	try {
		await assertPreviewDatabase(prisma)
		const license = await prisma.license.findFirstOrThrow({ where: { unlimitedCourses: true, published: true } })
		const user = await prisma.user.create({ data: { email, password: await hash(password, 12), emailVerified: new Date() } })
		userId = user.id
		await prisma.subscription.create({ data: { userId, licenseId: license.id, active: true, canceled: false, endDate: null } })
		await login(subscriber, email, password)
		await login(page.request, process.env.PREVIEW_ADMIN_EMAIL!, process.env.PREVIEW_ADMIN_PASSWORD!)
		const create = await page.request.post('/api/course/-1', { data: { name, description: '' } })
		expect(create.ok()).toBeTruthy()
		const course = await create.json()
		courseId = course.id
		expect(course.visible).toBe(false)
		const category = await page.request.post('/api/task-category/create', { data: { parentId: courseId, courseParent: true } })
		expect(category.ok()).toBeTruthy()
		categoryId = (await category.json()).id
		const task = await page.request.post('/api/task/-1', { data: { name: `Задание ${suffix}`, instruction: 'Материал в разработке', categories: [categoryId] } })
		expect(task.ok()).toBeTruthy()
		taskId = (await task.json()).id
		const userCourses = async () => (await (await subscriber.get('/api/studio/catalog')).json()).courses as Array<{ id: number; categoryTree: Array<{ tasks: Array<{id: number}> }> }>
		expect((await userCourses()).some(item => item.id === courseId)).toBe(false)
		await page.goto('/studio')
		await page.getByLabel('Курс', { exact: true }).selectOption(String(courseId))
		await expect(page.getByRole('status').filter({ hasText: 'Черновик курса' })).toBeVisible()

		await page.goto('/adm')
		await page.getByLabel('Разделы администрирования').getByRole('button', { name: 'Курсы', exact: true }).click()
		await page.getByRole('button', { name, exact: true }).click()
		const publication = page.getByRole('region', { name: 'Публикация курса' })
		await expect(publication).toContainText('Черновик — виден только администратору')
		const saved = page.waitForResponse(r => r.url().endsWith(`/api/course/${courseId}`) && r.request().method() === 'POST')
		await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
		expect((await saved).ok()).toBeTruthy()
		expect((await userCourses()).some(item => item.id === courseId)).toBe(false)
		page.on('dialog', dialog => dialog.accept())
		await publication.getByRole('button', { name: 'Опубликовать курс', exact: true }).click()
		await expect(publication).toContainText('Опубликован — доступен пользователям')
		const published = (await userCourses()).find(item => item.id === courseId)
		expect(published?.categoryTree.flatMap(node => node.tasks).some(item => item.id === taskId)).toBe(true)
		expect((await subscriber.patch(`/api/admin/visibility/course/${courseId}`, { data: { visible: false } })).status()).toBe(403)
		await publication.getByRole('button', { name: 'Снять курс с публикации', exact: true }).click()
		await expect(publication).toContainText('Черновик — виден только администратору')
		expect((await userCourses()).some(item => item.id === courseId)).toBe(false)
		await page.reload()
		const row = page.getByRole('row').filter({ hasText: name })
		await expect(row).toContainText('Черновик')
		await row.getByRole('button', { name: 'Опубликовать', exact: true }).click()
		await expect(row).toContainText('Опубликован')
		expect((await userCourses()).some(item => item.id === courseId)).toBe(true)
		await page.goto('/lk')
		const download = page.getByRole('link', { name: 'Скачать приложение для Windows' })
		await expect(download).toBeVisible()
		expect((await page.request.head((await download.getAttribute('href'))!)).status()).toBe(200)
	} finally {
		// Remove only this test's synthetic records, never a customer's course/account.
		if (taskId) { await prisma.categoryToTask.deleteMany({ where: { taskId } }); await prisma.task.delete({ where: { id: taskId } }) }
		if (categoryId) { await prisma.courseToCategory.deleteMany({ where: { categoryId } }); await prisma.taskCategory.delete({ where: { id: categoryId } }) }
		if (courseId) await prisma.course.delete({ where: { id: courseId } })
		if (userId) { await prisma.subscription.deleteMany({ where: { userId } }); await prisma.user.delete({ where: { id: userId } }) }
		await subscriber.dispose()
		await prisma.$disconnect()
	}
})
