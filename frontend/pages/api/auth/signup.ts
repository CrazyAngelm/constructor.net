import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
import { hash } from 'bcryptjs'
import { isEmail, isNonEmptyString, isObject, issueVerificationToken } from '@/lib/auth/verificationTokens'
import { getRegistrationHtml } from '@/lib/mailer/registration'
import { optionsWithFrom, sendMail } from '@/lib/mailer/mailer'
import { previewExternalFlowError, previewExternalFlowsRestricted } from '@/lib/preview'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.post(response(async (req, res) => {
	if (previewExternalFlowsRestricted()) return { error: previewExternalFlowError }
	const { email, password } = isObject(req.body) ? req.body : {}
	if (!isEmail(email) || !isNonEmptyString(password)) return { error: { code: 422, message: 'Invalid registration data' } }
	const checkExisting = await prisma.user.findUnique({
		where: {
			email,
		},
	})
	if (checkExisting) return { response: { status: 'Проверьте почту для завершения регистрации' } }
	const user = await prisma.user.create({
		data: {
			email,
			name: email,
			password: await hash(password, 12),
		},
	})
	const token = await issueVerificationToken(prisma, 'confirm-email', user.id)
	const mailOptions = optionsWithFrom({
		to: email,
		subject: 'Регистрация',
		html: getRegistrationHtml(token),
		amp: getRegistrationHtml(token),
		attachments:[ {
			path: 'assets/logo-512.png',
			cid: 'logo@nodemailer.com',
		} ],
	})
	await sendMail(mailOptions)
	return { response: { status: 'Проверьте почту для завершения регистрации' } }
}))
export default handler
