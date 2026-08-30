import { expect, test } from '@playwright/test'

test('landing leads to the dedicated web sign-in', async ({ page }) => {
	await page.goto('/')

	await expect(page.getByRole('heading', {
		level: 1,
		name: 'Конструктор учебных материалов, который остаётся в фокусе занятия.',
	})).toBeVisible()
	await expect(page.getByText('Текущая версия приложения остаётся доступна параллельно с веб-версией.')).toBeVisible()

	const callToAction = page.getByRole('link', { name: 'Открыть веб-версию' }).first()
	await expect(callToAction).toHaveAttribute('href', '/studio/auth')
	await callToAction.click()

	await expect(page).toHaveURL(/\/studio\/auth$/)
	await expect(page.getByRole('heading', { level: 2, name: 'Войти' })).toBeVisible()
	await expect(page.getByLabel('Email')).toBeVisible()
	await expect(page.getByLabel('Пароль')).toBeVisible()
	await expect(page.getByRole('link', { name: 'Вернуться на главную' })).toHaveAttribute('href', '/')
})

test('isolated preview rejects account and payment side effects before database access', async ({ request }) => {
	const signup = await request.post('/api/auth/signup', {
		data: { email: 'preview-check@example.invalid', password: 'not-a-real-password' },
	})
	const reset = await request.post('/api/auth/sendResetPassword', {
		data: { email: 'preview-check@example.invalid' },
	})
	const payment = await request.post('/api/subscription/payment', {
		data: { event: 'payment.succeeded', object: { id: 'preview-check' } },
	})

	for (const response of [ signup, reset, payment ]) {
		expect(response.status()).toBe(503)
		expect(await response.text()).toContain('Операция отключена')
	}
})
