import { afterEach, expect, it, vi } from 'vitest'
import { licenseCanEditFooter, sheetFooter } from './footer'
import { emptyStudioSheet } from './types'

afterEach(() => vi.unstubAllEnvs())
it('preserves the desktop license rule, with demo permission only in isolated preview', () => {
	vi.stubEnv('PREVIEW_DEPLOYMENT_MODE', '')
	vi.stubEnv('PREVIEW_LICENSE_NAME', 'Demo')
	expect(licenseCanEditFooter({ id: 3, name: 'Premium' })).toBe(true)
	expect(licenseCanEditFooter({ id: 4, name: 'Premium' })).toBe(true)
	expect(licenseCanEditFooter({ id: 1, name: 'Demo' })).toBe(false)
	vi.stubEnv('PREVIEW_DEPLOYMENT_MODE', 'isolated-preview')
	vi.stubEnv('PREVIEW_RESTRICT_EXTERNAL_FLOWS', 'true')
	expect(licenseCanEditFooter({ id: 1, name: 'Demo' })).toBe(true)
	expect(licenseCanEditFooter({ id: 1, name: 'Basic' })).toBe(false)
})
it('reads existing sheet footers without changing their content', () => {
	const sheet = emptyStudioSheet()
	sheet.data.settings.footer = 'Старая подпись'
	expect(sheetFooter(sheet)).toBe('Старая подпись')
	expect(sheetFooter({ version: 1, data: { items: [] } })).toBe('')
})
