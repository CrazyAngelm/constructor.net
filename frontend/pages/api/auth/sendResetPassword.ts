import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
import { getResetPassword } from '@/lib/mailer/registration'
import { optionsWithFrom, sendMail } from '@/lib/mailer/mailer'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.post(response(async (req, res) => {
	const { email } = req.body
	if (!email) return { error: { code: 422, message: 'email or password not found' } }
	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	})
	if (!user) return { error: { code: 422, message: 'Пользователя не сущетсвует' } }
	const token = Buffer.from(JSON.stringify({
		id: user.id,
		email: user.email,
		pass: user.password,
	}), 'binary').toString('base64')
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
	sendMail(mailOptions)
	return { response: { status: 'User created' } }
}))
export default handler
