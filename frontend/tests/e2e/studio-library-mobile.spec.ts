import { expect, test, APIRequestContext } from '@playwright/test'

async function login(request: APIRequestContext) {
	const csrf = await (await request.get('/api/auth/csrf')).json()
	await request.post('/api/auth/callback/credentials', { form: {
		csrfToken: csrf.csrfToken,
		email: process.env.PREVIEW_DEMO_EMAIL!,
		password: process.env.PREVIEW_DEMO_PASSWORD!,
		json: 'true',
	} })
	expect((await (await request.get('/api/auth/session')).json()).user).toBeTruthy()
}

test('mobile save stays reachable and the personal library supports folder, move, reopen and delete', async ({ page }, testInfo) => {
	test.slow()
	test.skip(!process.env.E2E_BASE_URL || !process.env.PREVIEW_DEMO_EMAIL || testInfo.project.name !== 'mobile-chromium', 'Requires seeded mobile preview')
	await login(page.request)
	const lessonName = `Мобильный конспект ${Date.now()}`
	const folderName = `Мобильная папка ${Date.now()}`
	let worklistId = ''
	let folderId = ''
	try {
		await page.goto('/studio')
		await page.getByRole('button', { name: 'Добавить текст', exact: true }).click()
		await page.getByLabel('Название конспекта').fill(lessonName)
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
		const saveButton = page.getByRole('button', { name: 'Сохранить', exact: true })
		const saveBounds = await saveButton.boundingBox()
		expect(saveBounds).not.toBeNull()
		expect(saveBounds!.y).toBeGreaterThanOrEqual(0)
		expect(saveBounds!.y + saveBounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height)

		await saveButton.click()
		const saveDialog = page.getByRole('dialog', { name: 'Сохранить в моих конспектах' })
		await expect(saveDialog.getByLabel('Название конспекта')).toHaveValue(lessonName)
		await saveDialog.getByLabel('Или создайте новую папку').fill(folderName)
		const folderResponse = page.waitForResponse(response => response.url().endsWith('/api/studio/folders') && response.request().method() === 'POST')
		await saveDialog.getByRole('button', { name: 'Создать', exact: true }).click()
		folderId = (await (await folderResponse).json()).id
		await expect(saveDialog.getByLabel('Папка')).toHaveValue(folderId)
		const saveResponse = page.waitForResponse(response => response.url().endsWith('/api/studio/worklists') && response.request().method() === 'POST')
		await saveDialog.getByRole('button', { name: 'Сохранить конспект', exact: true }).click()
		const saved = await (await saveResponse).json()
		worklistId = saved.id
		await expect(page.getByText(`Сохранено в «${folderName}»`, { exact: true })).toBeVisible()

		await expect(page.getByText('Лист педагога — план занятия и ваши инструкции.', { exact: false })).toBeVisible()
		await page.getByRole('button', { name: /^Лист ученика/ }).click()
		await expect(page.getByText('Лист ученика — материалы, которые вы даёте ребёнку.', { exact: false })).toBeVisible()
		await page.getByRole('button', { name: /^Лист педагога/ }).click()

		const preview = page.getByRole('region', { name: 'Предпросмотр листа' })
		await expect(preview).toHaveAttribute('data-pagination-ready', 'true')
		const fitFrame = await preview.locator('[class*="pageFrame"]').first().boundingBox()
		expect(fitFrame!.width).toBeLessThanOrEqual(page.viewportSize()!.width - 20)
		await preview.getByRole('button', { name: '100%', exact: true }).click()
		const actualFrame = await preview.locator('[class*="pageFrame"]').first().boundingBox()
		expect(actualFrame!.width).toBeGreaterThan(page.viewportSize()!.width)
		await preview.getByRole('button', { name: 'По ширине', exact: true }).click()

		await page.evaluate(() => { window.print = () => { document.body.dataset.printRequested = 'true' } })
		await page.getByRole('button', { name: 'Скачать PDF', exact: true }).click()
		const exportDialog = page.getByRole('dialog', { name: 'Скачать PDF' })
		await expect(exportDialog.getByText('Сохранить как PDF', { exact: false })).toBeVisible()
		await exportDialog.getByRole('button', { name: 'Открыть сохранение PDF', exact: true }).click()
		await expect.poll(() => page.locator('body').getAttribute('data-print-requested')).toBe('true')

		await page.getByRole('button', { name: 'Мои конспекты', exact: true }).click()
		const library = page.getByRole('dialog', { name: 'Мои конспекты' })
		for (const control of [ library.getByLabel('Новая папка'), library.getByRole('button', { name: 'Создать папку', exact: true }) ]) {
			expect(await control.evaluate(node => {
				const bounds = node.getBoundingClientRect()
				return node.contains(document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2))
			})).toBe(true)
		}
		await library.getByRole('button', { name: folderName, exact: true }).click()
		const card = library.locator('article').filter({ hasText: lessonName })
		await expect(card).toContainText(folderName)
		await card.getByRole('button', { name: 'Открыть', exact: true }).click()
		await expect(page.getByLabel('Название конспекта')).toHaveValue(lessonName)

		await page.getByRole('button', { name: 'Мои конспекты', exact: true }).click()
		const reopenedCard = library.locator('article').filter({ hasText: lessonName })
		await reopenedCard.getByLabel(`Папка для «${lessonName}»`).selectOption('')
		await reopenedCard.getByRole('button', { name: 'Переместить', exact: true }).click()
		await expect.poll(async () => (await (await page.request.get(`/api/studio/worklists/${worklistId}`)).json()).personalFolderId).toBeNull()
		await library.getByRole('button', { name: 'Без папки', exact: true }).click()
		let movedCard = library.locator('article').filter({ hasText: lessonName })
		await movedCard.getByLabel(`Папка для «${lessonName}»`).selectOption(folderId)
		await movedCard.getByRole('button', { name: 'Переместить', exact: true }).click()
		await expect.poll(async () => (await (await page.request.get(`/api/studio/worklists/${worklistId}`)).json()).personalFolderId).toBe(folderId)
		await library.getByRole('button', { name: folderName, exact: true }).click()
		await library.getByRole('button', { name: 'Удалить папку', exact: true }).click()
		await library.getByRole('button', { name: 'Удалить папку', exact: true }).click()
		await expect(library.getByRole('button', { name: folderName, exact: true })).toHaveCount(0)
		folderId = ''
		movedCard = library.locator('article').filter({ hasText: lessonName })
		await expect(movedCard.getByLabel(`Папка для «${lessonName}»`)).toHaveValue('')
		await expect(movedCard.getByRole('button', { name: 'Переместить', exact: true })).toBeDisabled()
		await movedCard.getByRole('button', { name: 'Удалить', exact: true }).click()
		await movedCard.getByRole('button', { name: 'Удалить конспект', exact: true }).click()
		await expect.poll(async () => (await page.request.get(`/api/studio/worklists/${worklistId}`)).status()).toBe(404)
		worklistId = ''
		await expect(page.getByLabel('Название конспекта')).toHaveValue('Новый конспект')
		await expect(page.getByText(/Сложност|Без уровня/)).toHaveCount(0)
	} finally {
		if (worklistId) await page.request.delete(`/api/studio/worklists/${worklistId}`)
		if (folderId) await page.request.delete(`/api/studio/folders/${folderId}`)
	}
})
