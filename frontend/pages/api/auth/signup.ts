
import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { encodeBase64, hash } from 'bcryptjs';
import { getRegistrationHtml } from "@/lib/mailer/registration";
import { optionsWithFrom, sendMail } from "@/lib/mailer/mailer";

const prisma = usePrisma()
const handler = getDefaultHandler()

handler.post(response(async (req, res) => {
	const { email, password } = req.body

	if (!email || !password) return { error: { code: 422, message: "email or password not found" } }

	const checkExisting = await prisma.user.findUnique({
		where: {
			email
		}
	})

	if (checkExisting) return { error: { code: 422, message: "User already exists" } }

	const user = await prisma.user.create({
		data: {
			email,
			name: email,
			password: await hash(password, 12)
		}
	})
	const token = Buffer.from(JSON.stringify({
		id: user.id,
		email: user.email
	}), 'binary').toString('base64')

	const mailOptions = optionsWithFrom({
		to: email,
		subject: 'Регистрация',
		html: getRegistrationHtml(token),
		amp: getRegistrationHtml(token),
		attachments:[{
			path: 'assets/logo-512.png',
			cid: 'logo@nodemailer.com'
		}]
	});

	sendMail(mailOptions)

	return { response: { status: "User created" } }
}))

export default handler

