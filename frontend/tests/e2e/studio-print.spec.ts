import { expect, test, type APIRequestContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { catalogTaskToSheetItem, emptyStudioSheet } from '../../lib/studio/types'
import type { StudioWorklist } from '../../lib/studio/types'

async function login(request: APIRequestContext) {
	const csrf = await (await request.get('/api/auth/csrf')).json()
	await request.post('/api/auth/callback/credentials', { form: {
		csrfToken: csrf.csrfToken, email: process.env.PREVIEW_ADMIN_EMAIL!, password: process.env.PREVIEW_ADMIN_PASSWORD!, json: 'true',
	} })
	expect((await (await request.get('/api/auth/session')).json()).user).toBeTruthy()
}

test('teacher and student printing contains exactly the preview pages, with no leading blank sheet', async ({ page }, testInfo) => {
	test.slow() // Authentication and rendering exercise the actual public deployment.
	test.skip(!process.env.PREVIEW_ADMIN_EMAIL, 'Requires controlled test credentials')
	await login(page.request)
	const teacherSheet = emptyStudioSheet()
	const studentSheet = emptyStudioSheet()
	for (const [ sheet, kind ] of [ [ teacherSheet, 'Педагог' ], [ studentSheet, 'Ученик' ] ] as const) {
		sheet.data.settings.footer = `Контрольная подпись — ${kind}`
		const task = { ...catalogTaskToSheetItem({ id: 0, name: `Задание — ${kind}`, description: '', instruction: 'Эта инструкция должна быть на первом печатном листе.', complexity: null, image: null }, randomUUID()), sourceTaskId: null }
		sheet.data.items = [
			task,
			{ ...task, instanceId: randomUUID(), kind: 'spacer', spacerHeightMm: 90 },
			{ ...task, instanceId: randomUUID(), kind: 'spacer', spacerHeightMm: 90 },
			{ ...task, instanceId: randomUUID(), name: `Последнее задание — ${kind}` },
		]
	}
	const response = await page.request.post('/api/studio/worklists', { data: {
		name: `Проверка печати ${randomUUID()}`, teacherSheet, studentSheet,
	} })
	expect(response.ok()).toBeTruthy()
	const saved = await response.json() as StudioWorklist
	try {
		await page.goto('/studio')
		await page.getByRole('button', { name: 'Мои конспекты', exact: true }).first().click()
		await page.getByRole('dialog', { name: 'Мои конспекты' }).locator('article').filter({ hasText: saved.name }).getByRole('button', { name: 'Открыть', exact: true }).click()
		const preview = page.getByRole('region', { name: 'Предпросмотр листа' })
		await page.getByText('Настройки листа', { exact: true }).click()
		for (const [ kind, filename ] of [ [ 'педагога', 'teacher' ], [ 'ученика', 'student' ] ] as const) {
			await page.getByRole('button', { name: new RegExp(`^Лист ${kind}`) }).click()
			for (const format of [ 'A4', 'A5', 'A3' ] as const) {
				await page.getByLabel('Формат', { exact: true }).selectOption(format)
				await expect(preview).toHaveAttribute('data-pagination-ready', 'true')
				await expect(preview.getByRole('alert')).toHaveCount(0)
				const pageCount = await preview.locator('[data-pdf-page]').count()
				await page.emulateMedia({ media: 'print' })
				await expect(page.getByRole('button', { name: 'Программы LabStudio', exact: true }).last()).toBeHidden()
				await page.screenshot({ path: testInfo.outputPath(`${filename}-${format}-print-layout.png`), fullPage: true })
				const pdf = await page.pdf({ path: testInfo.outputPath(`${filename}-${format}.pdf`), printBackground: true, preferCSSPageSize: true })
				// Chromium emits an uncompressed /Type /Page dictionary for each physical PDF page.
				const printedPages = pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0
				expect.soft(printedPages, `${kind}, ${format}: printed pages must match the physical preview`).toBe(pageCount)
				// Reproduce ordinary browser printing with margins from the default sheet settings.
				const margins = teacherSheet.data.settings.margins
				const browserPdf = await page.pdf({
					path: testInfo.outputPath(`${filename}-${format}-browser.pdf`), format, displayHeaderFooter: true,
					margin: { top: `${margins.top}mm`, bottom: `${margins.bottom}mm`, left: `${margins.left}mm`, right: `${margins.right}mm` },
				})
				const browserPages = browserPdf.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0
				expect.soft(browserPages, `${kind}, ${format}: browser margins and headers must not add a page`).toBe(pageCount)
				await expect(preview.locator('[data-pdf-page]')).toHaveCount(pageCount)
				await page.emulateMedia({ media: 'screen' })
			}
		}
	} finally {
		expect((await page.request.delete(`/api/studio/worklists/${saved.id}`)).ok()).toBeTruthy()
	}
})
