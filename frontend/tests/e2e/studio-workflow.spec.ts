import { expect, test, APIRequestContext } from '@playwright/test'
import type { StudioCategory, StudioCourse, StudioSheetItem, StudioTask } from '../../lib/studio/types'

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

const flattenTasks = (nodes: StudioCategory[]): StudioTask[] => nodes.flatMap(node => [
	...node.tasks,
	...flattenTasks(node.children),
])

const findNestedTaskPath = (nodes: StudioCategory[], path: StudioCategory[] = []): StudioCategory[] | null => {
	for (const node of nodes) {
		const next = [ ...path, node ]
		if (path.length > 0 && node.tasks.length > 0) return next
		const found = findNestedTaskPath(node.children, next)
		if (found) return found
	}
	return null
}

test('hierarchical catalog, editable sheets, uploads, pagination, persistence and access control', async ({ page, browser }, testInfo) => {
	test.skip(!process.env.E2E_BASE_URL || !email || !password || testInfo.project.name !== 'desktop-chromium', 'Requires the seeded isolated preview')
	// This acceptance pass includes several browser sessions, PDF rendering and cleanup.
	await authenticate(page.request, 'DEMO')
	await page.goto('/studio')
	await expect(page.getByRole('heading', { name: 'Конструктор занятия' })).toBeVisible()
	const catalogPanel = page.getByRole('complementary', { name: 'Каталог заданий' })
	const courseSelect = catalogPanel.getByRole('combobox')
	await expect(courseSelect).toBeVisible()

	const catalogResponse = await page.request.get('/api/studio/catalog')
	expect(catalogResponse.ok()).toBeTruthy()
	const catalog = await catalogResponse.json() as { courses: StudioCourse[] }
	expect(catalog.courses.length).toBeGreaterThan(0)
	expect(catalog.courses.every(course => Array.isArray(course.categoryTree)), JSON.stringify(catalog.courses.map(course => Object.keys(course)))).toBeTruthy()
	const nestedCourse = catalog.courses.find(course => findNestedTaskPath(course.categoryTree))
	expect(nestedCourse, 'the copied desktop catalog must contain nested folders').toBeTruthy()
	const nestedPath = findNestedTaskPath(nestedCourse!.categoryTree)!
	expect(nestedPath.length).toBeGreaterThan(1)

	await courseSelect.selectOption(String(nestedCourse!.id))
	const root = nestedPath[0]!
	await catalogPanel.getByRole('button', { name: `Посмотреть упражнения раздела «${root.name}»`, exact: true }).click()
	const categoryDialog = page.getByRole('dialog', { name: root.name })
	await expect(categoryDialog).toBeVisible()
	expect(await categoryDialog.locator('article').count()).toBeGreaterThan(0)
	await categoryDialog.getByRole('button', { name: /^Открыть «/ }).first().click()
	await expect(page.getByText('Предварительный просмотр', { exact: true })).toBeVisible()
	await page.getByRole('button', { name: 'Закрыть просмотр', exact: true }).click()
	await expect(page.getByRole('button', { name: 'Лист педагога 0', exact: true })).toBeVisible()

	const tree = catalogPanel.getByRole('navigation', { name: 'Папки курса' })
	for (const category of nestedPath.slice(0, -1)) {
		const expand = tree.getByRole('button', { name: `Развернуть ${category.name}`, exact: true })
		if (await expand.count()) await expand.click()
	}
	const leaf = nestedPath.at(-1)!
	await tree.getByRole('button', { name: leaf.name, exact: true }).last().click()
	await expect(catalogPanel.getByRole('heading', { name: leaf.name, exact: true }).last()).toBeVisible()

	const tasks = [ ...new Map<number, StudioTask>(catalog.courses
		.flatMap(course => flattenTasks(course.categoryTree))
		.map(task => [ task.id, task ])).values() ]
	const nameCounts = tasks.reduce((counts, task) => counts.set(task.name, (counts.get(task.name) || 0) + 1), new Map<string, number>())
	const selected = tasks.filter(task => task.image && nameCounts.get(task.name) === 1).slice(0, 2) as [ StudioTask & { image: string }, StudioTask & { image: string } ]
	expect(selected).toHaveLength(2)
	const lessonName = `Проверка занятия ${Date.now()}`
	await page.getByLabel('Название конспекта').fill(lessonName)

	await page.getByRole('textbox', { name: 'Поиск заданий' }).fill(selected[0].name)
	const matchingPreviews = catalogPanel.getByRole('button', { name: `Посмотреть «${selected[0].name}»`, exact: true })
	await expect(matchingPreviews).toHaveCount(1)
	await matchingPreviews.click()
	const taskDialog = page.getByRole('dialog', { name: selected[0].name })
	await expect(taskDialog.getByRole('img', { name: selected[0].name })).toBeVisible()
	await taskDialog.getByRole('button', { name: 'Добавить в текущий лист', exact: true }).click()
	await page.getByRole('textbox', { name: 'Поиск заданий' }).fill(selected[1].name)
	await catalogPanel.getByRole('button', { name: `Добавить «${selected[1].name}»`, exact: true }).first().click()

	const uploadResponse = page.waitForResponse(response => response.url().endsWith('/api/studio/uploads') && response.request().method() === 'POST')
	await page.locator('input[type="file"][accept="image/png,image/jpeg"]').first().setInputFiles({
		name: 'Моя карточка.png',
		mimeType: 'image/png',
		buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z2dwAAAAASUVORK5CYII=', 'base64'),
	})
	const uploadedResult = await uploadResponse
	expect(uploadedResult.ok()).toBeTruthy()
	const uploaded = await uploadedResult.json() as { url: string }
	expect(uploaded.url).toMatch(/^\/api\/studio\/files\/[0-9a-f-]{36}\.png$/)
	await page.getByRole('button', { name: 'Добавить текст', exact: true }).click()
	await page.getByRole('button', { name: 'Свободное место', exact: true }).click()
	await page.getByRole('complementary', { name: 'Параметры элемента' }).getByLabel('Высота, мм').fill('18')

	const builder = page.getByRole('region', { name: 'Состав занятия' })
	await builder.getByRole('listitem').filter({ hasText: selected[0].name }).first().getByRole('button').first().click()
	const inspector = page.getByRole('complementary', { name: 'Параметры элемента' })
	await inspector.getByRole('textbox', { name: 'Инструкция / текст', exact: true }).fill('Проверенная инструкция педагога')
	await inspector.getByLabel('Ширина изображения, %').fill('72')
	await page.getByRole('button', { name: `Поднять «${selected[1].name}»`, exact: true }).click()

	await page.getByText('Настройки листа', { exact: true }).click()
	await page.getByLabel('Слева', { exact: true }).fill('16')
	await page.getByLabel('Размер текста, пт').fill('9.5')
	await page.getByLabel('Подпись внизу листа').fill('Для ребёнка: Анна')

	await page.getByRole('button', { name: /^Лист ученика/ }).click()
	await page.getByRole('textbox', { name: 'Поиск заданий' }).fill(selected[0].name)
	await catalogPanel.getByRole('button', { name: `Добавить «${selected[0].name}»`, exact: true }).first().click()
	await inspector.getByRole('textbox', { name: 'Инструкция / текст', exact: true }).fill('Самостоятельная инструкция ученика')
	await page.getByLabel('Подпись внизу листа').fill('Лист ученика')

	const saveResponse = page.waitForResponse(response => response.url().endsWith('/api/studio/worklists') && response.request().method() === 'POST')
	await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
	const savedResponse = await saveResponse
	expect(savedResponse.ok()).toBeTruthy()
	const saved = await savedResponse.json()
	expect(saved.teacherSheet.version).toBe(2)
	expect(saved.teacherSheet.data.items).toHaveLength(5)
	expect(saved.teacherSheet.data.items.slice(0, 2).map((item: StudioSheetItem) => item.sourceTaskId)).toEqual([ selected[1].id, selected[0].id ])
	expect(saved.teacherSheet.data.items[1].instruction).toBe('Проверенная инструкция педагога')
	expect(saved.teacherSheet.data.items[1].imageWidthPercent).toBe(72)
	expect(saved.teacherSheet.data.settings).toMatchObject({ footer: 'Для ребёнка: Анна', fontSizePt: 9.5, margins: { left: 16 } })
	expect(saved.studentSheet.data.items).toHaveLength(1)
	expect(saved.studentSheet.data.items[0].instruction).toBe('Самостоятельная инструкция ученика')
	expect(saved.studentSheet.data.settings.footer).toBe('Лист ученика')
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
		await reopened.getByRole('region', { name: 'Состав занятия' }).getByRole('listitem').filter({ hasText: selected[0].name }).first().getByRole('button').first().click()
		await expect(reopened.getByRole('complementary', { name: 'Параметры элемента' }).getByRole('textbox', { name: 'Инструкция / текст', exact: true })).toHaveValue('Проверенная инструкция педагога')
		const preview = reopened.getByRole('region', { name: 'Предпросмотр листа' })
		await expect(preview).toHaveAttribute('data-pagination-ready', 'true')
		const pages = preview.locator('[aria-label^="Страница "]')
		expect(await pages.count()).toBeGreaterThan(1)
		await expect(preview.getByRole('alert')).toHaveCount(0)
		const layoutChecks = await pages.evaluateAll(pageNodes => pageNodes.flatMap(pageNode => {
			const body = pageNode.querySelector<HTMLElement>('[class*="pageBody"]')
			if (!body) return [ false ]
			const bounds = body.getBoundingClientRect()
			return [ ...body.querySelectorAll<HTMLElement>('[data-sheet-item], [aria-label^="Свободное место"]') ].map(item => {
				const rect = item.getBoundingClientRect()
				return rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1
			})
		}))
		expect(layoutChecks.length).toBe(saved.teacherSheet.data.items.length)
		expect(layoutChecks.every(Boolean)).toBeTruthy()
		const imageChecks = await preview.locator('img').evaluateAll(images => images.map(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))
		expect(imageChecks.length).toBeGreaterThan(1)
		expect(imageChecks.every(Boolean)).toBeTruthy()
		await reopened.screenshot({ path: testInfo.outputPath('workspace.png'), fullPage: true })
		await reopened.emulateMedia({ media: 'print' })
		await expect(reopened.getByRole('complementary', { name: 'Каталог заданий' })).toBeHidden()
		await expect(preview).toBeVisible()
		await reopened.screenshot({ path: testInfo.outputPath('print-preview.png'), fullPage: true })
		await reopened.pdf({ path: testInfo.outputPath('teacher-sheet.pdf'), printBackground: true, preferCSSPageSize: true })
		await reopened.emulateMedia({ media: 'screen' })

		const imageResponse = await second.request.get(selected[0].image)
		expect(imageResponse.ok()).toBeTruthy()
		expect(imageResponse.headers()['content-type']).toMatch(/^image\//)
		const ownImageResponse = await second.request.get(uploaded.url)
		expect(ownImageResponse.status()).toBe(200)
		expect(ownImageResponse.headers()['x-content-type-options']).toBe('nosniff')
		expect((await admin.request.get(uploaded.url)).status()).toBe(404)
		expect((await second.request.get('/api/task')).status()).toBe(403)
		expect((await second.request.get(`/api/task/${selected[0].id}`)).status()).toBe(403)
		expect((await second.request.get('/api/admin/visibility')).status()).toBe(403)
		expect((await admin.request.get(`/api/studio/worklists/${saved.id}`)).status()).toBe(404)

		const course = catalog.courses[0]!
		const category = course.categories.find(item => item.tasks.length > 0)!
		const adminPage = await admin.newPage()
		await adminPage.goto('/adm')
		await adminPage.locator('menu').hover()
		await adminPage.getByRole('button', { name: 'Видимость каталога', exact: true }).click()
		await expect(adminPage.getByRole('heading', { name: 'Папки заданий', exact: true })).toBeVisible()
		const courseRow = adminPage.getByRole('row').filter({ has: adminPage.getByRole('cell', { name: course.name, exact: true }) }).first()
		await courseRow.getByRole('button', { name: 'Скрыть', exact: true }).click()
		try {
			await expect(courseRow.getByRole('button', { name: 'Показать', exact: true })).toBeVisible()
			expect((await (await second.request.get('/api/studio/catalog')).json()).courses.some((item: StudioCourse) => item.id === course.id)).toBe(false)
			await courseRow.getByRole('button', { name: 'Показать', exact: true }).click()
			await expect(courseRow.getByRole('button', { name: 'Скрыть', exact: true })).toBeVisible()
		} finally {
			await admin.request.patch(`/api/admin/visibility/course/${course.id}`, { data: { visible: true } })
		}
		for (const [ type, id ] of [ [ 'category', category.id ], [ 'course', course.id ] ] as const) {
			const endpoint = `/api/admin/visibility/${type}/${id}`
			expect((await admin.request.patch(endpoint, { data: { visible: false } })).ok()).toBeTruthy()
			try {
				const hidden = await (await second.request.get('/api/studio/catalog')).json()
				if (type === 'course') expect(hidden.courses.some((item: StudioCourse) => item.id === id)).toBe(false)
				else expect(hidden.courses.flatMap((item: StudioCourse) => item.categories).some((item: StudioCategory) => item.id === id)).toBe(false)
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
		expect(edited.teacherSheet.data.items).toHaveLength(4)
		expect(edited.studentSheet.data.items).toHaveLength(1)
	} finally {
		await page.request.delete(`/api/studio/worklists/${saved.id}`)
		await second.close()
		await admin.close()
	}
})
