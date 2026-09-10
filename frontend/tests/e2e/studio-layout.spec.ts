import { expect, test, APIRequestContext } from '@playwright/test'
import { catalogTaskToSheetItem, emptyStudioSheet } from '../../lib/studio/types'
import type { StudioCategory, StudioCourse, StudioWorklist } from '../../lib/studio/types'

async function login(request: APIRequestContext, role: 'DEMO' | 'ADMIN') {
	const csrf = await (await request.get('/api/auth/csrf')).json()
	await request.post('/api/auth/callback/credentials', { form: { csrfToken: csrf.csrfToken, email: process.env[`PREVIEW_${role}_EMAIL`]!, password: process.env[`PREVIEW_${role}_PASSWORD`]!, json: 'true' } })
	expect((await (await request.get('/api/auth/session')).json()).user).toBeTruthy()
}
const categories = (nodes: StudioCategory[]): StudioCategory[] => nodes.flatMap(node => [ node, ...categories(node.children) ])

test('resize reflow, two columns, typography, personal folders and text previews survive reopen and print', async ({ page, browser }, testInfo) => {
	test.skip(!process.env.E2E_BASE_URL || !process.env.PREVIEW_DEMO_EMAIL || testInfo.project.name !== 'desktop-chromium', 'Requires seeded preview')
	await login(page.request, 'DEMO')
	const admin = await browser.newContext({ baseURL: process.env.E2E_BASE_URL })
	await login(admin.request, 'ADMIN')
	const catalog = await (await page.request.get('/api/studio/catalog')).json() as { courses: StudioCourse[] }
	const course = catalog.courses.find(course => categories(course.categoryTree).some(category => category.tasks.some(task => task.image)))!
	const task = categories(course.categoryTree).flatMap(category => category.tasks).find(task => task.image)!
	const teacherSheet = emptyStudioSheet()
	const first = { ...catalogTaskToSheetItem(task, 'image-left'), description: '', instruction: '', complexity: null, imageWidthPercent: 70 }
	const last = { ...first, instanceId: 'image-right', imageWidthPercent: 100, name: 'Последняя картинка' }
	teacherSheet.data.items = [ { ...first, instanceId: 'intro', kind: 'text', name: 'Текст перед картинками', image: null, instruction: 'Короткое задание для проверки переноса.' }, first, last ]
	const create = await page.request.post('/api/studio/worklists', { data: { name: `Раскладка ${Date.now()}`, teacherSheet, studentSheet: emptyStudioSheet(), courseId: course.id } })
	expect(create.ok()).toBeTruthy()
	const saved = await create.json() as StudioWorklist
	const folderIds: string[] = []
	try {
		await page.goto('/studio')
		await page.getByRole('button', { name: `${saved.name} Открыть` }).click()
		const builder = page.getByRole('region', { name: 'Состав занятия' })
		const inspector = page.getByRole('complementary', { name: 'Параметры элемента' })
		const preview = page.getByRole('region', { name: 'Предпросмотр листа' })
		await expect(preview).toHaveAttribute('data-pagination-ready', 'true')
		const measurement = await page.locator('main').evaluate(main => {
			const measuredBody = main.querySelector<HTMLElement>('[data-page-capacity]')!
			const visibleBody = main.querySelector<HTMLElement>('[aria-label="Предпросмотр листа"] [class*="pageBody"]')!
			return { capacity: measuredBody.clientHeight, visibleCapacity: visibleBody.clientHeight, measured: [ ...main.querySelectorAll<HTMLElement>('[data-measure-item]') ].map(node => ({ id: node.dataset.measureItem, height: node.getBoundingClientRect().height })), visible: [ ...main.querySelectorAll<HTMLElement>('[aria-label="Предпросмотр листа"] [data-sheet-item]') ].map(node => ({ id: node.dataset.sheetItem, height: node.getBoundingClientRect().height })) }
		})
		expect(measurement.capacity).toBe(measurement.visibleCapacity)
		for (const item of measurement.measured) {
			const visible = measurement.visible.find(value => value.id === item.id)!
			// Physical millimetres produce subpixel rounding; use the existing one-CSS-pixel layout tolerance.
			expect(Math.abs(item.height - visible.height)).toBeLessThanOrEqual(1)
		}
		// Derive the precondition from this image's measured height, not a hardcoded spacer or image dimension.
		const dimensions = await preview.locator('[data-sheet-item="image-right"]').evaluate(node => ({ height: node.getBoundingClientRect().height, imageHeight: node.querySelector('img')!.getBoundingClientRect().height }))
		const body = await preview.locator('[class*="pageBody"]').first().evaluate(node => ({ height: node.clientHeight - parseFloat(getComputedStyle(node).paddingTop), gap: parseFloat(getComputedStyle(node).gap) }))
		const otherHeights = await preview.locator('[data-sheet-item="intro"], [data-sheet-item="image-left"]').evaluateAll(nodes => nodes.reduce((total, node) => total + node.getBoundingClientRect().height, 0))
		// Adjust explicit item spacing so the final whole block just needs its image reduced.
		const gap = Math.max(0, (body.height - otherHeights - dimensions.height + dimensions.imageHeight / 2) / 2)
		await page.getByText('Настройки листа', { exact: true }).click()
		await page.getByLabel('Интервал между заданиями, мм').fill(String(gap * 25.4 / 96))
		await expect(preview.locator('[data-sheet-item="image-right"]').locator('xpath=ancestor::article[@aria-label]').first()).toHaveAttribute('aria-label', /^Страница 2 /)
		await builder.getByRole('listitem').filter({ hasText: 'Последняя картинка' }).getByRole('button').first().click()
		const resize = preview.getByRole('button', { name: 'Изменить размер изображения «Последняя картинка»' })
		await resize.scrollIntoViewIfNeeded()
		const handle = (await resize.boundingBox())!
		const column = await preview.locator('[data-column-id="image-right"]').boundingBox()
		await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
		await page.mouse.down()
		await page.mouse.move(handle.x + handle.width / 2 - column!.width, handle.y + handle.height / 2)
		await page.mouse.up()
		await expect(inspector.getByLabel('Ширина изображения, %')).toHaveValue('1')
		await expect(preview.locator('[data-sheet-item="image-right"]').locator('xpath=ancestor::article[@aria-label]').first()).toHaveAttribute('aria-label', /^Страница 1 /)
		await inspector.getByLabel('Ширина изображения, %').fill('100')
		await expect(preview.locator('[data-sheet-item="image-right"]').locator('xpath=ancestor::article[@aria-label]').first()).toHaveAttribute('aria-label', /^Страница 2 /)
		await page.getByLabel('Интервал между заданиями, мм').fill('5')
		await builder.getByRole('button', { name: 'Разместить со следующим рядом' }).last().click()
		await expect(preview.locator('[data-sheet-item="image-left"] [data-column-id]')).toHaveCount(2)
		await builder.getByRole('listitem').filter({ hasText: 'Последняя картинка' }).getByRole('button', { name: /Правая колонка/ }).click()
		await inspector.getByLabel('Ширина изображения, %').fill('45')
		await inspector.getByLabel('Шрифт задания').selectOption('Arial')
		await inspector.getByLabel('Размер текста задания, пт').fill('12')
		await inspector.getByLabel('Выравнивание текста').selectOption('right')
		await inspector.getByLabel('Инструкция / текст', { exact: true }).fill('Текст правой колонки')
		await page.getByLabel('Шрифт листа').selectOption('Arial')
		await page.getByLabel('Размер заголовка, пт').fill('18')
		await page.getByLabel('Шрифт подписи').selectOption('Arial')
		await page.getByLabel('Размер подписи, пт').fill('9')
		await page.getByLabel('Подпись внизу листа').fill('Для тестового ученика')
		const library = page.getByRole('region', { name: 'Личные конспекты' })
		const folderName = `Ученик ${Date.now()}`
		await library.getByLabel('Название новой папки').fill(folderName)
		const folderResponse = page.waitForResponse(response => response.url().endsWith('/api/studio/folders') && response.request().method() === 'POST')
		await library.getByRole('button', { name: 'Создать папку' }).click()
		const folder = await (await folderResponse).json()
		folderIds.push(folder.id)
		await library.getByLabel('Сохранить текущий конспект в папку').selectOption(folder.id)
		await page.getByRole('button', { name: 'Обновить каталог', exact: true }).click()
		await expect(page.getByText('Каталог обновлён. Черновик не изменён.')).toBeVisible()
		await page.route('**/api/studio/catalog', route => route.fulfill({ status: 503, json: { message: 'Тест: каталог временно недоступен' } }))
		await page.getByRole('button', { name: 'Обновить каталог', exact: true }).click()
		await expect(page.getByText('Тест: каталог временно недоступен')).toBeVisible()
		await expect(page.getByRole('complementary', { name: 'Каталог заданий' }).getByLabel('Курс', { exact: true }).locator('option')).toHaveCount(catalog.courses.length)
		await page.unroute('**/api/studio/catalog')
		await expect(page.getByLabel('Название конспекта')).toHaveValue(saved.name)
		await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
		await expect(page.getByText('Сохранено', { exact: true })).toBeVisible()
		const persisted = await (await page.request.get(`/api/studio/worklists/${saved.id}`)).json() as StudioWorklist
		expect(persisted.personalFolderId).toBe(folder.id)
		expect(persisted.teacherSheet.data.items[1]?.companion).toMatchObject({ instanceId: 'image-right', image: task.image, imageWidthPercent: 45, fontFamily: 'Arial', fontSizePt: 12, textAlignment: 'right', instruction: 'Текст правой колонки' })
		expect(persisted.studentSheet.data.items).toHaveLength(0)
		const legacyWrite = await page.request.put(`/api/studio/worklists/${saved.id}`, { data: { teacherSheet: { version: 2, data: emptyStudioSheet().data } } })
		expect(legacyWrite.status()).toBe(409)
		expect((await (await page.request.get(`/api/studio/worklists/${saved.id}`)).json()).teacherSheet).toEqual(persisted.teacherSheet)
		expect((await admin.request.get('/api/studio/folders')).ok()).toBeTruthy()
		expect((await (await admin.request.get('/api/studio/folders')).json()).folders.some((value: { id: string }) => value.id === folder.id)).toBe(false)
		expect((await admin.request.put(`/api/studio/folders/${folder.id}`, { data: { name: 'Чужое' } })).status()).toBe(404)
		expect((await admin.request.delete(`/api/studio/folders/${folder.id}`)).status()).toBe(404)
		expect((await admin.request.post('/api/studio/worklists', { data: { name: 'Чужая папка', teacherSheet: emptyStudioSheet(), studentSheet: emptyStudioSheet(), personalFolderId: folder.id } })).status()).toBe(404)
		await page.reload()
		await library.getByLabel('Показать конспекты').selectOption(folder.id)
		await page.getByRole('button', { name: `${saved.name} Открыть` }).click()
		await expect(preview).toHaveAttribute('data-pagination-ready', 'true')
		await expect(preview.getByRole('alert')).toHaveCount(0)
		const checkBounds = () => preview.locator('[data-sheet-item]').evaluateAll(nodes => nodes.every(node => { const r = node.getBoundingClientRect(); const b = node.parentElement!.getBoundingClientRect(); return r.bottom <= b.bottom + 1 && r.top >= b.top - 1 }))
		expect(await checkBounds()).toBe(true)
		await expect(preview.locator('[data-column-id="image-right"]')).toHaveCSS('text-align', 'right')
		await expect(preview.locator('[data-column-id="image-right"]')).toHaveCSS('font-size', '16px')
		const pageCount = await preview.locator('article[aria-label^="Страница"]').count()
		await page.emulateMedia({ media: 'print' })
		expect(await checkBounds()).toBe(true)
		await expect(preview.getByRole('button', { name: /Изменить размер изображения/ }).first()).toBeHidden()
		await page.pdf({ path: testInfo.outputPath('paired-sheet.pdf'), preferCSSPageSize: true, printBackground: true })
		expect(await preview.locator('article[aria-label^="Страница"]').count()).toBe(pageCount)
		await page.emulateMedia({ media: 'screen' })
		await builder.getByRole('button', { name: 'Поменять колонки местами' }).click()
		await builder.getByRole('button', { name: 'Разделить колонки' }).click()
		await expect(builder.getByRole('listitem')).toHaveCount(3)
		await builder.getByRole('button', { name: 'Разместить со следующим рядом' }).first().click()
		await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
		await expect(page.getByText('Сохранено', { exact: true })).toBeVisible()
		const textPair = await (await page.request.get(`/api/studio/worklists/${saved.id}`)).json() as StudioWorklist
		expect(textPair.teacherSheet.data.items[0]).toMatchObject({ kind: 'text', companion: { image: task.image } })
		await page.reload()
		await page.getByRole('button', { name: `${saved.name} Открыть` }).click()
		await library.getByLabel('Показать конспекты').selectOption(folder.id)
		await expect(preview).toHaveAttribute('data-pagination-ready', 'true')
		await page.emulateMedia({ media: 'print' })
		expect(await checkBounds()).toBe(true)
		await page.screenshot({ path: testInfo.outputPath('text-image-print.png'), fullPage: true })
		await page.emulateMedia({ media: 'screen' })
		await library.getByRole('button', { name: 'Изменить название' }).click()
		await library.getByLabel('Новое название папки').fill(folderName + ' — изменено')
		await library.getByRole('button', { name: 'Переименовать папку' }).click()
		await expect(library.getByLabel('Показать конспекты').locator('option:checked')).toHaveText(folderName + ' — изменено')
		page.once('dialog', dialog => dialog.accept())
		await library.getByRole('button', { name: 'Удалить папку', exact: true }).click()
		await expect(library.getByRole('button', { name: `${saved.name} Открыть` })).toBeVisible()
		expect((await (await page.request.get(`/api/studio/worklists/${saved.id}`)).json()).personalFolderId).toBe(null)
		const textCategory = catalog.courses.flatMap(course => categories(course.categoryTree)).find(category => category.tasks.some(task => !task.image && task.instruction.trim()))!
		const textCourse = catalog.courses.find(course => categories(course.categoryTree).some(category => category.id === textCategory.id))!
		const panel = page.getByRole('complementary', { name: 'Каталог заданий' })
		await panel.getByLabel('Курс', { exact: true }).selectOption(String(textCourse.id))
		// Root section preview includes all descendant tasks, including text-only exercises.
		const root = textCourse.categoryTree.find(root => categories([root]).some(category => category.id === textCategory.id))!
		await panel.getByRole('button', { name: `Посмотреть упражнения раздела «${root.name}»`, exact: true }).click()
		const dialog = page.getByRole('dialog', { name: root.name })
		await expect(dialog.getByText('Читать полностью', { exact: true }).first()).toBeVisible()
		const textTask = categories([root]).flatMap(category => category.tasks).find(task => !task.image && task.instruction.trim())!
		const card = dialog.getByRole('button', { name: `Открыть «${textTask.name}»`, exact: true }).first()
		await expect(card).toContainText(textTask.instruction.trim())
		await card.click()
		await expect(page.getByRole('dialog').getByText(textTask.instruction, { exact: true })).toBeVisible()
		await page.getByRole('button', { name: 'Закрыть просмотр', exact: true }).click()
		await page.screenshot({ path: testInfo.outputPath('layout-workspace.png'), fullPage: true })
	} finally {
		await page.request.delete(`/api/studio/worklists/${saved.id}`)
		for (const id of folderIds) await page.request.delete(`/api/studio/folders/${id}`)
		await admin.close()
	}
})
