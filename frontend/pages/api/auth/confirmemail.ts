import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
import { consumeVerificationToken, isNonEmptyString, isObject } from '@/lib/auth/verificationTokens'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.post(response(async (req, res) => {
	const { token } = isObject(req.body) ? req.body : {}
	if (!isNonEmptyString(token)) return { error: { code: 422, message: 'Неверный токен' } }
	const userId = await consumeVerificationToken(prisma, 'confirm-email', token)
	if (!userId) return { error: { code: 422, message: 'Неверный токен' } }
	const user = await prisma.user.findUnique({where:{
		id: userId,
	}})
	if(!user) return {error:{code:422, message: 'Неверный токен'}}
	if(user.emailVerified) return {response:{status: 'Пользователь уже подтвержден'}}
	await prisma.user.update({
		where:{
			id:user.id,
		},
		data:{
			emailVerified: (new Date()).toISOString(),
		},
	})
	return { response: { status: 'Пользователь успешно подтвержден' } }
}))
export default handler
