import { expect, test, type APIRequestContext } from '@playwright/test'
import { emptyStudioSheet, type StudioSheetItem } from '../../lib/studio/types'

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

const textItem = (instanceId: string, instruction: string): StudioSheetItem => ({
	instanceId, sourceTaskId: null, kind: 'text', name: instanceId,
	description: '', instruction, complexity: null, image: null,
	showDescription: false, showInstruction: true,
	imageWidthPercent: 100, imageAlignment: 'center', spacerHeightMm: 0,
})

test('copying a saved lesson opens an independent copy with both sheets in the same folder', async ({ page }) => {
	test.skip(!process.env.E2E_BASE_URL || !process.env.PREVIEW_DEMO_EMAIL, 'Requires seeded preview')
	await login(page.request)
	const name = `Исходный конспект ${Date.now()}`
	const folderName = `Папка копирования ${Date.now()}`
	const teacherSheet = emptyStudioSheet()
	teacherSheet.data.items = [ textItem('teacher-copy-test', 'Инструкция педагога') ]
	const studentSheet = emptyStudioSheet()
	studentSheet.data.items = [ textItem('student-copy-test', 'Задание ученику') ]
	let folderId = ''
	let sourceId = ''
	let copyId = ''
	try {
		const folderResponse = await page.request.post('/api/studio/folders', { data: { name: folderName } })
		expect(folderResponse.ok()).toBeTruthy()
		folderId = (await folderResponse.json()).id
		const sourceResponse = await page.request.post('/api/studio/worklists', { data: { name, teacherSheet, studentSheet, personalFolderId: folderId } })
		expect(sourceResponse.ok()).toBeTruthy()
		const source = await sourceResponse.json()
		sourceId = source.id

		await page.goto('/studio')
		await page.getByRole('button', { name: 'Мои конспекты', exact: true }).click()
		const library = page.getByRole('dialog', { name: 'Мои конспекты' })
		await library.getByRole('button', { name: folderName, exact: true }).click()
		const sourceCard = library.locator('article').filter({ hasText: name })
		const duplicateResponse = page.waitForResponse(response => response.url().endsWith(`/api/studio/worklists/${sourceId}/duplicate`) && response.request().method() === 'POST')
		await sourceCard.getByRole('button', { name: 'Создать копию', exact: true }).click()
		const response = await duplicateResponse
		expect(response.ok()).toBeTruthy()
		const copy = await response.json()
		copyId = copy.id
		expect(copyId).not.toBe(sourceId)
		expect(copy.name).toBe(`Копия: ${name}`)
		expect(copy.personalFolderId).toBe(folderId)
		expect(copy.teacherSheet).toEqual(source.teacherSheet)
		expect(copy.studentSheet).toEqual(source.studentSheet)
		await expect(library).toBeHidden()
		await expect(page.getByLabel('Название конспекта')).toHaveValue(copy.name)
		await expect(page.getByRole('region', { name: 'Состав занятия' })).toContainText('Инструкция педагога')
		await page.getByRole('button', { name: /^Лист ученика/ }).click()
		await expect(page.getByRole('region', { name: 'Состав занятия' })).toContainText('Задание ученику')

		const editedName = `${name} — изменена копия`
		await page.getByLabel('Название конспекта').fill(editedName)
		const saveResponse = page.waitForResponse(result => result.url().endsWith(`/api/studio/worklists/${copyId}`) && result.request().method() === 'PUT')
		await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
		expect((await saveResponse).ok()).toBeTruthy()
		const savedCopy = await (await page.request.get(`/api/studio/worklists/${copyId}`)).json()
		const unchangedSource = await (await page.request.get(`/api/studio/worklists/${sourceId}`)).json()
		expect(savedCopy.name).toBe(editedName)
		expect(unchangedSource.name).toBe(name)
		expect(unchangedSource.teacherSheet).toEqual(source.teacherSheet)
		expect(unchangedSource.studentSheet).toEqual(source.studentSheet)
	} finally {
		if (copyId) await page.request.delete(`/api/studio/worklists/${copyId}`)
		if (sourceId) await page.request.delete(`/api/studio/worklists/${sourceId}`)
		if (folderId) await page.request.delete(`/api/studio/folders/${folderId}`)
	}
})
