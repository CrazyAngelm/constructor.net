import { expect, test } from '@playwright/test'

test('admin menu is a flyout, closes after selection, and preserves an unsaved editor', async ({ page }) => {
	test.slow() // Public preview authentication and catalog requests cross the network.
	test.skip(!process.env.PREVIEW_ADMIN_EMAIL, 'Requires a controlled admin account')
	const csrf = await (await page.request.get('/api/auth/csrf')).json()
	await page.request.post('/api/auth/callback/credentials', { form: {
		csrfToken: csrf.csrfToken, email: process.env.PREVIEW_ADMIN_EMAIL!, password: process.env.PREVIEW_ADMIN_PASSWORD!, json: 'true',
	} })
	expect((await (await page.request.get('/api/auth/session')).json()).user).toBeTruthy()
	await page.goto('/adm')
	const trigger = page.getByRole('button', { name: 'Разделы администрирования', exact: true })
	// Fails immediately on the old permanent-column navigation.
	expect(await trigger.count()).toBe(1)
	const menu = page.locator('#admin-navigation')
	await expect(menu).toBeHidden()
	await expect(trigger).toHaveAttribute('aria-expanded', 'false')
	await trigger.click()
	await expect(menu).toBeVisible()
	await expect(trigger).toHaveAttribute('aria-expanded', 'true')
	await menu.getByRole('button', { name: 'Версии', exact: true }).focus()
	await page.keyboard.press('Tab')
	// Native dialogs can tab through browser chrome, but never into the inert application.
	expect(await menu.evaluate(node => node.contains(document.activeElement) || document.activeElement === document.body)).toBe(true)
	await menu.getByRole('button', { name: 'Курсы', exact: true }).click()
	await expect(menu).toBeHidden()
	await expect(trigger).toBeFocused()
	await expect(page.getByRole('button', { name: 'Создать курс', exact: true })).toBeVisible()
	await page.locator('header > span[role="button"]').first().click()
	const name = page.getByLabel('Название', { exact: true })
	await expect(name).toBeVisible()
	const draft = `${await name.inputValue()} — несохранённая проверка`
	await name.fill(draft)
	await trigger.click()
	await page.keyboard.press('Escape')
	await expect(menu).toBeHidden()
	await expect(trigger).toBeFocused()
	await expect(name).toHaveValue(draft)
	await page.screenshot({ path: test.info().outputPath('admin-workspace.png'), fullPage: true })
	await trigger.click()
	await page.screenshot({ path: test.info().outputPath('admin-menu-open.png'), fullPage: true })
	await menu.getByRole('button', { name: 'Курсы', exact: true }).click()
	await expect(menu).toBeHidden()
	await expect(name).toHaveValue(draft)
	const content = page.locator('[data-admin-content]')
	const bounds = await content.boundingBox()
	expect(bounds).not.toBeNull()
	// The closed menu must not leave its old 224px column in the workspace.
	expect(bounds!.x).toBeLessThan(224)
	await trigger.click()
	const viewport = page.viewportSize()!
	await page.mouse.click(viewport.width - 1, viewport.height / 2)
	await expect(menu).toBeHidden()
	await expect(name).toHaveValue(draft)
	for (const section of ['Пользователи', 'Методички', 'Версии', 'Публикация курсов']) {
		await trigger.click()
		await menu.getByRole('button', { name: section, exact: true }).click()
		await expect(menu).toBeHidden()
		await trigger.click()
		await expect(menu.getByRole('button', { name: section, exact: true })).toHaveAttribute('aria-current', 'page')
		await menu.getByRole('button', { name: 'Закрыть меню', exact: true }).click()
		await expect(menu).toBeHidden()
	}
	// Mobile navigation must not widen the page beyond its viewport.
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
