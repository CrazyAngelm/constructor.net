import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
import { isEmail, isObject, issueVerificationToken } from '@/lib/auth/verificationTokens'
import { getResetPassword } from '@/lib/mailer/registration'
import { optionsWithFrom, sendMail } from '@/lib/mailer/mailer'
import { previewExternalFlowError, previewExternalFlowsRestricted } from '@/lib/preview'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.post(response(async (req, res) => {
	if (previewExternalFlowsRestricted()) return { error: previewExternalFlowError }
	const { email } = isObject(req.body) ? req.body : {}
	if (!isEmail(email)) return { error: { code: 422, message: 'Invalid email' } }
	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	})
	if (!user) return { response: { status: 'Если учетная запись существует, письмо отправлено' } }
	const token = await issueVerificationToken(prisma, 'reset-password', user.id)
	const mailOptions = optionsWithFrom({
		to: email,
		subject: 'Сброс пароля',
		html: getResetPassword(token),
		amp: getResetPassword(token),
		attachments: [ {
			path: 'assets/logo-512.png',
			cid: 'logo@nodemailer.com',
		} ],
	})
	await sendMail(mailOptions)
	return { response: { status: 'Если учетная запись существует, письмо отправлено' } }
}))
export default handler
