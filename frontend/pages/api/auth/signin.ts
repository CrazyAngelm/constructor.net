import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
import { compare } from 'bcryptjs'
import { isEmail, isNonEmptyString, isObject } from '@/lib/auth/verificationTokens'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.post(response(async (req, res) => {
	const { email, password } = isObject(req.body) ? req.body : {}
	if (!isEmail(email) || !isNonEmptyString(password)) return { error: { code: 422, message: 'Invalid credentials' } }
	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	})
	if (!user) return { error: { code: 422, message: 'Invalid password or email' } }
	const checkPassword = await compare(password, user.password ?? '')
	if (!checkPassword) return { error: { code: 422, message: 'Invalid password or email' } }
	return { response: user }
}))
export default handler
