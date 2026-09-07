import { expect, test, APIRequestContext } from '@playwright/test'

const email = process.env.PREVIEW_DEMO_EMAIL
const password = process.env.PREVIEW_DEMO_PASSWORD

async function authenticate(request: APIRequestContext, role: 'ADMIN' | 'DEMO') {
	const csrf = await (await request.get('/api/auth/csrf')).json()
	const result = await request.post('/api/auth/callback/credentials', { form: {
		csrfToken: csrf.csrfToken, email: process.env[`PREVIEW_${role}_EMAIL`]!,
		password: process.env[`PREVIEW_${role}_PASSWORD`]!, json: 'true',
	} })
	expect(result.ok()).toBeTruthy()
	expect((await (await request.get('/api/auth/session')).json()).user).toBeTruthy()
}

test('real catalog, independent sheets, persistence, print and access control', async ({ page, browser }, testInfo) => {
	test.skip(!process.env.E2E_BASE_URL || !email || !password || testInfo.project.name !== 'desktop-chromium', 'Requires the seeded isolated preview')
	// This full acceptance pass includes several browser sessions and transfers.
	// Keep per-operation checks without an aggregate cap that aborts cleanup.
	test.setTimeout(0)
	await page.goto('/studio/auth')
	await page.getByLabel('Email', { exact: true }).fill(email!)
	await page.getByLabel('Пароль', { exact: true }).fill(password!)
	await page.getByRole('button', { name: 'Войти в веб-версию' }).click()
	await expect(page).toHaveURL(/\/studio$/)
	await expect(page.getByRole('heading', { name: 'Конструктор занятия' })).toBeVisible()
	const catalogResponse = await page.request.get('/api/studio/catalog')
	expect(catalogResponse.ok()).toBeTruthy()
	const catalog = await catalogResponse.json()
	expect(catalog.courses.length).toBeGreaterThan(0)
	const tasks = [...new Map<number, { id: number; name: string; image: string }>(catalog.courses.flatMap((c: any) => c.categories.flatMap((f: any) => f.tasks)).map((task: any) => [task.id, task])).values()]
	expect(tasks.length).toBeGreaterThan(1)
	const selected = tasks.filter((task) => task.image).slice(0, 2) as [typeof tasks[number], typeof tasks[number]]
	expect(selected).toHaveLength(2)
	const lessonName = `Проверка занятия ${Date.now()}`
	await page.getByLabel('Название конспекта').fill(lessonName)
	const catalogPanel = page.getByRole('complementary', { name: 'Каталог заданий' })
	for (const task of selected) {
		await page.getByRole('textbox', { name: 'Поиск заданий' }).fill(task.name)
		await catalogPanel.getByRole('button').filter({ has: page.locator('span', { hasText: task.name }) }).first().click()
	}
	await page.getByRole('button', { name: `Поднять «${selected[1].name}»`, exact: true }).click()
	await page.getByRole('complementary', { name: 'Параметры задания' }).getByRole('textbox', { name: 'Инструкция', exact: true }).fill('Проверенная инструкция педагога')
	await page.getByRole('button', { name: /^Лист ученика/ }).click()
	await page.getByRole('textbox', { name: 'Поиск заданий' }).fill(selected[0].name)
	await catalogPanel.getByRole('button').filter({ has: page.locator('span', { hasText: selected[0].name }) }).first().click()
	await page.getByRole('complementary', { name: 'Параметры задания' }).getByRole('textbox', { name: 'Инструкция', exact: true }).fill('Самостоятельная инструкция ученика')
	const saveResponse = page.waitForResponse((response) => response.url().endsWith('/api/studio/worklists') && response.request().method() === 'POST')
	await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
	const savedResponse = await saveResponse
	expect(savedResponse.ok()).toBeTruthy()
	const saved = await savedResponse.json()
	expect(saved.teacherSheet.data.items.map((item: any) => item.id)).toEqual([selected[1].id, selected[0].id])
	expect(saved.studentSheet.data.items).toHaveLength(1)
	expect(saved.studentSheet.data.items[0].instruction).toBe('Самостоятельная инструкция ученика')
	expect(saved.teacherSheet.data.items[0].instruction).toBe('Проверенная инструкция педагога')
	await expect(page.getByText('Сохранено', { exact: true })).toBeVisible()
	const second = await browser.newContext({ baseURL: process.env.E2E_BASE_URL })
	const admin = await browser.newContext({ baseURL: process.env.E2E_BASE_URL })
	try {
		await authenticate(second.request, 'DEMO')
		await authenticate(admin.request, 'ADMIN')
		const session = await (await second.request.get('/api/auth/session')).json()
		expect(session.user).not.toHaveProperty('password')
		const reopened = await second.newPage()
		await reopened.goto('/studio')
		await reopened.getByRole('button', { name: `${lessonName} Открыть` }).click()
		await expect(reopened.getByLabel('Название конспекта')).toHaveValue(lessonName)
		await expect(reopened.getByRole('complementary', { name: 'Параметры задания' }).getByRole('textbox', { name: 'Инструкция', exact: true })).toHaveValue('Проверенная инструкция педагога')
		await reopened.screenshot({ path: testInfo.outputPath('workspace.png'), fullPage: true })
		await reopened.emulateMedia({ media: 'print' })
		await expect(reopened.getByRole('complementary', { name: 'Каталог заданий' })).toBeHidden()
		await expect(reopened.getByRole('region', { name: 'Предпросмотр листа' })).toBeVisible()
		await reopened.pdf({ path: testInfo.outputPath('teacher-sheet.pdf'), format: 'A4', printBackground: true })
		await reopened.emulateMedia({ media: 'screen' })
		const imageResponse = await second.request.get(selected[0].image)
		expect(imageResponse.ok()).toBeTruthy()
		expect(imageResponse.headers()['content-type']).toMatch(/^image\//)
		expect((await second.request.get('/api/task')).status()).toBe(403)
		expect((await second.request.get(`/api/task/${selected[0].id}`)).status()).toBe(403)
		expect((await second.request.get('/api/admin/visibility')).status()).toBe(403)
		expect((await admin.request.get(`/api/studio/worklists/${saved.id}`)).status()).toBe(404)
		const course = catalog.courses[0]
		const category = course.categories.find((item: any) => item.tasks.length > 0)
		const adminPage = await admin.newPage()
		await adminPage.goto('/adm')
		await adminPage.locator('menu').hover()
		await adminPage.getByText('Видимость каталога', { exact: true }).click()
		await expect(adminPage.getByRole('heading', { name: 'Папки заданий', exact: true })).toBeVisible()
		const courseRow = adminPage.getByRole('row').filter({ has: adminPage.getByRole('cell', { name: course.name, exact: true }) }).first()
		await courseRow.getByRole('button', { name: 'Скрыть', exact: true }).click()
		try {
			await expect(courseRow.getByRole('button', { name: 'Показать', exact: true })).toBeVisible()
			expect((await (await second.request.get('/api/studio/catalog')).json()).courses.some((item: any) => item.id === course.id)).toBe(false)
			await courseRow.getByRole('button', { name: 'Показать', exact: true }).click()
			await expect(courseRow.getByRole('button', { name: 'Скрыть', exact: true })).toBeVisible()
		} finally {
			await admin.request.patch(`/api/admin/visibility/course/${course.id}`, { data: { visible: true } })
		}
		for (const [type, id] of [['category', category.id], ['course', course.id]] as const) {
			const endpoint = `/api/admin/visibility/${type}/${id}`
			expect((await admin.request.patch(endpoint, { data: { visible: false } })).ok()).toBeTruthy()
			try {
				const hidden = await (await second.request.get('/api/studio/catalog')).json()
				if (type === 'course') expect(hidden.courses.some((item: any) => item.id === id)).toBe(false)
				else expect(hidden.courses.flatMap((item: any) => item.categories).some((item: any) => item.id === id)).toBe(false)
			} finally {
				expect((await admin.request.patch(endpoint, { data: { visible: true } })).ok()).toBeTruthy()
			}
		}
		const manuals = await (await second.request.get('/api/studio/manuals')).json()
		expect(manuals.manuals.length).toBeGreaterThan(0)
		await expect(reopened.getByRole('region', { name: 'Руководства' })).toBeVisible()
		await reopened.getByRole('button', { name: `Удалить «${selected[1].name}»`, exact: true }).click()
		await reopened.getByRole('button', { name: 'Сохранить', exact: true }).click()
		await expect(reopened.getByText('Сохранено', { exact: true })).toBeVisible()
		const edited = await (await second.request.get(`/api/studio/worklists/${saved.id}`)).json()
		expect(edited.teacherSheet.data.items).toHaveLength(1)
		expect(edited.studentSheet.data.items).toHaveLength(1)
	} finally {
		await page.request.delete(`/api/studio/worklists/${saved.id}`)
		await second.close()
		await admin.close()
	}
})
