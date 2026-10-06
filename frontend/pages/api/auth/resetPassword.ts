import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
import { hash } from 'bcryptjs'
import { consumeVerificationToken, isNonEmptyString, isObject } from '@/lib/auth/verificationTokens'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.post(response(async (req, res) => {
	const { token, newPassword } = isObject(req.body) ? req.body : {}
	if (!isNonEmptyString(token) || !isNonEmptyString(newPassword)) return { error: { code: 422, message: 'Данные для сброса пароля неверные или устарели' } }
	const id = await consumeVerificationToken(prisma, 'reset-password', token)
	if (!id) return { error: { code: 422, message: 'Данные для сброса пароля неверные или устарели' } }
	const user = await prisma.user.findUnique({
		where: {
			id,
		},
	})
	if (!user) return { error: { code: 422, message: 'Данные для сьроса пароля неверные или устарели' } }
	await prisma.user.update({
		where:{id},
		data: {
			password: await hash(newPassword, 12),
		},
	})
	return { response: { status: 'пароль сменен' } }
}))
export default handler
