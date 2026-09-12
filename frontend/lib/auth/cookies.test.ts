import { afterEach, expect, it, vi } from 'vitest'
import { previewAuthCookies } from './cookies'

afterEach(() => vi.unstubAllEnvs())
it('uses distinct secure cookies when preview shares the production hostname', () => {
	vi.stubEnv('PREVIEW_DEPLOYMENT_MODE', 'isolated-preview')
	vi.stubEnv('PREVIEW_RESTRICT_EXTERNAL_FLOWS', 'true')
	vi.stubEnv('NEXTAUTH_URL', 'https://labstudio-inc.ru:8443')
	const cookies = previewAuthCookies()!
	expect(cookies.sessionToken.name).toBe('__Secure-labstudio-preview.session-token')
	expect(new Set(Object.values(cookies).map((cookie) => cookie.name)).size).toBe(3)
	expect(Object.values(cookies).every((cookie) => cookie.options.secure)).toBe(true)
})
it('preserves normal auth cookie configuration outside the isolated preview', () => {
	vi.stubEnv('PREVIEW_DEPLOYMENT_MODE', '')
	expect(previewAuthCookies()).toBeUndefined()
})
