import { expect, test, type APIRequestContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'

async function login(request: APIRequestContext, role: 'ADMIN' | 'DEMO') {
	const csrf = await (await request.get('/api/auth/csrf')).json()
	await request.post('/api/auth/callback/credentials', { form: {
		csrfToken: csrf.csrfToken, email: process.env[`PREVIEW_${role}_EMAIL`]!, password: process.env[`PREVIEW_${role}_PASSWORD`]!, json: 'true',
	} })
	expect((await (await request.get('/api/auth/session')).json()).user).toBeTruthy()
}

for (const role of [ 'ADMIN', 'DEMO' ] as const) {
	test(`${role}: folder creation is actionable before entering a name and persists in the account`, async ({ page }, testInfo) => {
		test.slow() // Real authentication and folder persistence cross the public network.
		test.skip(!process.env[`PREVIEW_${role}_EMAIL`], 'Requires controlled test credentials')
		await login(page.request, role)
		const folderIds: string[] = []
		try {
			await page.goto('/studio')
			await page.getByRole('button', { name: 'Мои конспекты', exact: true }).first().click()
			const library = page.getByRole('dialog', { name: 'Мои конспекты' })
			const name = library.getByLabel('Новая папка', { exact: true })
			const create = library.getByRole('button', { name: 'Создать папку', exact: true })
			// Control: distinguish an unexplained disabled button from denied server access.
			const controlName = `Проверка папки ${randomUUID()}`
			await name.fill(controlName)
			const controlResponse = page.waitForResponse(response => response.url().endsWith('/api/studio/folders') && response.request().method() === 'POST')
			await create.click()
			const control = await controlResponse
			expect(control.ok()).toBeTruthy()
			const folder = await control.json()
			folderIds.push(folder.id)
			await expect(library.getByRole('button', { name: controlName, exact: true })).toBeVisible()
			await expect(name).toHaveValue('')
			await page.screenshot({ path: testInfo.outputPath('folder-control.png'), fullPage: true })
			// The reported regression: clicking Create must guide to the name, not silently disable it.
			expect(await create.isEnabled()).toBe(true)
			await create.click()
			await expect(name).toBeFocused()
			await expect(library.getByRole('alert')).toContainText('Введите название папки')
			await expect(name).toHaveAttribute('aria-invalid', 'true')
			await name.fill('   ')
			await create.click()
			await expect(name).toBeFocused()
			await expect(library.getByRole('alert')).toContainText('Введите название папки')
			const nextName = `Новая папка ${randomUUID()}`
			await name.fill(nextName)
			const response = page.waitForResponse(response => response.url().endsWith('/api/studio/folders') && response.request().method() === 'POST')
			await name.press('Enter')
			const saved = await response
			expect(saved.ok()).toBeTruthy()
			folderIds.push((await saved.json()).id)
			await expect(library.getByRole('button', { name: nextName, exact: true })).toBeVisible()
			await expect(library.getByRole('alert')).toHaveCount(0)
			await page.reload()
			await page.getByRole('button', { name: 'Мои конспекты', exact: true }).first().click()
			await expect(library.getByRole('button', { name: nextName, exact: true })).toBeVisible()
			await library.getByRole('button', { name: 'Закрыть мои конспекты', exact: true }).click()
			// The same creation affordance is also available in the first-save dialog.
			await page.getByRole('button', { name: 'Сохранить', exact: true }).first().click()
			const saveDialog = page.getByRole('dialog', { name: 'Сохранить в моих конспектах' })
			const quickName = saveDialog.getByLabel('Или создайте новую папку')
			const quickCreate = saveDialog.getByRole('button', { name: 'Создать', exact: true })
			await expect(quickCreate).toBeEnabled()
			await quickCreate.click()
			await expect(quickName).toBeFocused()
			await expect(saveDialog.getByRole('alert')).toContainText('Введите название папки')
			const quickFolderName = `Папка при сохранении ${randomUUID()}`
			await quickName.fill(quickFolderName)
			const quickResponse = page.waitForResponse(response => response.url().endsWith('/api/studio/folders') && response.request().method() === 'POST')
			await quickName.press('Enter')
			const quick = await quickResponse
			expect(quick.ok()).toBeTruthy()
			const quickFolder = await quick.json()
			folderIds.push(quickFolder.id)
			await expect(saveDialog.getByRole('combobox', { name: 'Папка', exact: true })).toHaveValue(quickFolder.id)
			await expect(saveDialog).toBeVisible() // Enter creates the folder, not the entire lesson.
			await page.screenshot({ path: testInfo.outputPath('folder-save-dialog.png'), fullPage: true })
		} finally {
			for (const id of folderIds) expect((await page.request.delete(`/api/studio/folders/${id}`)).ok()).toBeTruthy()
		}
	})
}
