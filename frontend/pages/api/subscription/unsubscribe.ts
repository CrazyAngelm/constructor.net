import { getDefaultHandler } from '@/lib/api/apiHandler'
import { responseAuth } from '@/lib/api/response'
import { readJsonBody } from '@/lib/api/body'
import { getPrisma } from '@/lib/api/database'
import { UnsubscribeReq } from '@/lib/dto/subscription'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.post(responseAuth(async (req, _res, userId) => {
	const body = readJsonBody<UnsubscribeReq>(req.body)
	if (!body?.subscriptionId) return { error: { code: 400, message: 'Invalid request' } }
	const data = await prisma.subscription.updateMany({
		where: { id: body.subscriptionId, userId },
		data: { canceled: true },
	})
	if (!data || data.count === 0) return { error: { code: 415, message: 'Подписки не найдено' } }
	return { response: {} }
}))
export default handler

