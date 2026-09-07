import { test, expect, Page, TestInfo } from '@playwright/test'
import type { StudioCategory } from '../../components/studio/StudioWorkspace'

async function screenshot(page: Page, testInfo: TestInfo, name: string) {
	await page.evaluate(() => document.fonts.ready)
	await page.evaluate(async () => { await Promise.all([ ...document.images ].map(image => { image.loading = 'eager'; return image.decode().catch(() => undefined) })) })
	expect(await page.evaluate(() => [ ...document.images ].filter(image => !image.naturalWidth).map(image => image.getAttribute('src')))).toEqual([])
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width)
	await page.screenshot({ path: testInfo.outputPath(name + '.png'), scale: 'css', animations: 'disabled' })
}

async function login(page: Page, role: 'DEMO' | 'ADMIN') {
	const csrf = await (await page.request.get('/api/auth/csrf')).json()
	await page.request.post('/api/auth/callback/credentials', { form: { csrfToken: csrf.csrfToken, email: process.env[`PREVIEW_${role}_EMAIL`]!, password: process.env[`PREVIEW_${role}_PASSWORD`]!, json: 'true' } })
	expect((await (await page.request.get('/api/auth/session')).json()).user).toBeTruthy()
}

test('public pages have usable states and fit the viewport', async ({ page }, testInfo) => {
	test.setTimeout(0) // Whole-site traversal; retain Playwright per-operation timeouts.
	for (const [ url, heading, name ] of [
		[ '/', 'Материалы к занятию — в одном месте.', 'home' ],
		[ '/studio/auth', 'Войти', 'signin' ],
		[ '/auth', 'Войти', 'legacy-auth' ],
		[ '/docs', 'Руководства к занятиям', 'docs-guest' ],
		[ '/license', 'Лицензионное соглашение', 'license' ],
		[ '/missing-visual-review', 'Страница не найдена', '404' ],
		[ '/confirmemail?token=visual-invalid', 'Подтверждение почты', 'confirm' ],
		[ '/reset-password?token=visual-invalid', 'Новый пароль', 'reset' ],
		[ '/subscribe-sucessful', 'Статус подписки', 'subscription-result' ],
	]) {
		await page.goto(url!)
		await expect(page.getByRole('heading', { name: heading!, exact: true })).toBeVisible()
		if (name === 'confirm') await expect(page.locator('main [role="alert"]')).toBeVisible()
		await screenshot(page, testInfo, name!)
		if (name === 'home') {
			await expect(page.locator('#pricing article').first()).toBeVisible()
			for (const selector of [ '[aria-label="Возможности Lab Studio"]', '#how', '#pricing', '#faq', 'footer' ]) {
				await page.locator(selector).scrollIntoViewIfNeeded()
				await screenshot(page, testInfo, 'home-' + selector.replace(/[^a-z]/gi, ''))
			}
		}
	}
	const pdf = await page.request.get('/docs/license.pdf')
	expect(pdf.ok()).toBeTruthy()
	expect(pdf.headers()['content-type']).toContain('application/pdf')
	await page.goto('/studio/auth')
	await page.getByLabel('Email', { exact: true }).fill('nobody@visual-audit.invalid')
	await page.getByLabel('Пароль', { exact: true }).fill('invalid')
	await page.getByRole('button', { name: 'Войти в веб-версию' }).click()
	await expect(page.locator('main [role="alert"]')).toContainText('Не удалось войти')
	await screenshot(page, testInfo, 'signin-error')
})

test('account navigation and every published manual are readable', async ({ page }, testInfo) => {
	test.skip(!process.env.PREVIEW_DEMO_EMAIL, 'Requires isolated preview credentials')
	test.setTimeout(0)
	await login(page, 'DEMO')
	await page.goto('/lk')
	await expect(page.getByRole('heading', { name: 'Личные данные' })).toBeVisible()
	await screenshot(page, testInfo, 'account')
	const accessResponses = Promise.all([
		page.waitForResponse(response => response.url().endsWith('/api/studio/catalog')),
		page.waitForResponse(response => response.url().endsWith('/api/subscription/me')),
	])
	await page.getByRole('link', { name: 'Подписки', exact: true }).click()
	for (const response of await accessResponses) {
		expect(response.ok()).toBeTruthy()
		await response.finished()
	}
	await expect(page.getByText('Демонстрационный доступ', { exact: true })).toBeVisible()
	await screenshot(page, testInfo, 'access')
	await page.goBack()
	await expect(page.getByRole('heading', { name: 'Личные данные' })).toBeVisible()
	await page.goForward()
	await expect(page.getByRole('heading', { name: 'Доступ к материалам' })).toBeVisible()
	await page.goto('/docs')
	const data = await (await page.request.get('/api/studio/manuals')).json()
	expect(data.manuals.length).toBeGreaterThan(0)
	for (const manual of data.manuals) {
		if (testInfo.project.name === 'mobile-chromium') await page.getByLabel('Выберите руководство').selectOption(String(manual.id))
		else await page.getByRole('button', { name: manual.name, exact: true }).click()
		await expect(page.getByRole('article', { name: 'Текст руководства' }).getByRole('heading', { name: manual.name, exact: true })).toBeVisible()
		await screenshot(page, testInfo, 'manual-' + manual.id)
	}
})

test('admin lists and existing editors are readable without changing records', async ({ page }, testInfo) => {
	test.skip(!process.env.PREVIEW_ADMIN_EMAIL || testInfo.project.name !== 'desktop-chromium', 'Requires administrator preview on desktop')
	test.setTimeout(0)
	await login(page, 'ADMIN')
	await page.goto('/adm')
	await expect(page.getByRole('heading', { name: 'Видимость каталога' })).toBeVisible()
	await screenshot(page, testInfo, 'admin-visibility')
	await page.getByLabel('Поиск по названию').fill('Нейрокоррекция')
	await screenshot(page, testInfo, 'admin-search')
	await page.getByRole('button', { name: 'Пользователи', exact: true }).click()
	await page.getByRole('cell', { name: 'Preview demo', exact: true }).click()
	await expect(page.getByLabel('Имя', { exact: true })).toHaveValue('Preview demo')
	await screenshot(page, testInfo, 'admin-user')
	await expect(page.getByRole('button', { name: 'Удалить', exact: true })).toHaveCount(0)
	await page.getByRole('button', { name: 'Курсы', exact: true }).click()
	const catalog = await (await page.request.get('/api/studio/catalog')).json()
	const course = catalog.courses[0]
	await page.getByRole('button', { name: course.name, exact: true }).click()
	await expect(page.getByLabel('Название', { exact: true })).toHaveValue(course.name)
	await screenshot(page, testInfo, 'admin-course')
	await page.getByRole('button', { name: 'Развернуть ' + course.name, exact: true }).click()
	const category = course.categories.find((item: StudioCategory) => item.tasks.length)
	await page.getByRole('button', { name: category.name, exact: true }).click()
	await expect(page.getByRole('heading', { name: 'Задания', exact: true })).toBeVisible()
	await screenshot(page, testInfo, 'admin-category')
	await page.getByRole('cell', { name: category.tasks[0].name, exact: true }).click()
	await expect(page.getByLabel('Название', { exact: true })).toHaveValue(category.tasks[0].name)
	await screenshot(page, testInfo, 'admin-task')
	await page.getByRole('button', { name: 'Методички', exact: true }).click()
	const manuals = await (await page.request.get('/api/studio/manuals')).json()
	await page.getByRole('button', { name: manuals.manuals[0].name, exact: true }).click()
	await expect(page.getByRole('region', { name: 'Предпросмотр методички' })).toBeVisible()
	await screenshot(page, testInfo, 'admin-manual')
	await page.getByText('Редактировать HTML', { exact: true }).click()
	await expect(page.getByLabel('Содержимое методички (HTML)')).toBeVisible()
	await screenshot(page, testInfo, 'admin-manual-editor')
	await page.getByRole('button', { name: 'Версии', exact: true }).click()
	await expect(page.getByText('Пока нет записей.', { exact: true })).toBeVisible()
	await screenshot(page, testInfo, 'admin-versions')
})
