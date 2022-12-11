import template from '@/assets/mailer/Registration.html'
import buildUrl from 'build-url-ts'


export const getRegistrationHtml = (token:string) => {
	var html = template as string
	const link = buildUrl(process.env.NEXTAUTH_URL ?? "http://localhost", {
		path:"confirmemail",
		queryParams:{
			token
		}
	})
	html = html.replaceAll(/:$link$:/g, link)
	return html
}
