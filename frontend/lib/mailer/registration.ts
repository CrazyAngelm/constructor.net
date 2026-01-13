import template from '@/assets/mailer/Registration.html'
import templateReset from '@/assets/mailer/ResetPassword.html'
import buildUrl from 'build-url-ts'

export const getRegistrationHtml = (token:string) => {
	let html = template as string
	const link = buildUrl(process.env.NEXTAUTH_URL ?? 'http://localhost', {
		path:'confirmemail',
		queryParams:{
			token,
		},
	})
	html = html.replace(/\$link\$/g, link)
	return html
}

export const getResetPassword = (token: string) => {
	let html = templateReset as string
	const link = buildUrl(process.env.NEXTAUTH_URL ?? 'http://localhost', {
		path: 'reset-password',
		queryParams: {
			token,
		},
	})
	html = html.replace(/\$link\$/g, link)
	return html
}
