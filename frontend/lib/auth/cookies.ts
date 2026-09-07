import { previewExternalFlowsRestricted } from '../preview'

// Ports share a cookie jar. Preview on the same hostname must not replace
// the current site's NextAuth cookies.
export const previewAuthCookies = () => {
	if (!previewExternalFlowsRestricted()) return undefined
	const secure = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false
	const prefix = secure ? '__Secure-' : ''
	const options = { httpOnly: true, sameSite: 'lax' as const, path: '/', secure }
	return {
		sessionToken: { name: `${prefix}labstudio-preview.session-token`, options },
		csrfToken: { name: `${prefix}labstudio-preview.csrf-token`, options },
		callbackUrl: { name: `${prefix}labstudio-preview.callback-url`, options },
	}
}
