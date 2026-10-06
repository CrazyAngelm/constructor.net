import { getDefaultHandler } from '@/lib/api/apiHandler'
import { responseAuth } from '@/lib/api/response'
import { readJsonBody } from '@/lib/api/body'
import { getPrisma } from '@/lib/api/database'
import { ChangePaymentMethodReq } from '@/lib/dto/subscription'
import { previewExternalFlowError, previewExternalFlowsRestricted } from '@/lib/preview'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.post(responseAuth(async (req, _res, userId) => {
	if (previewExternalFlowsRestricted()) return { error: previewExternalFlowError }
	const body = readJsonBody<ChangePaymentMethodReq>(req.body)
	if (!body?.subscriptionId) return { error: { code: 400 } }
	const subscription = await prisma.subscription.findFirst({
		where: { id: body.subscriptionId, userId },
	})
	if (!subscription) return { error: { code: 404, message: 'Subscription not found' } }
	await prisma.subscription.update({
		where: { id: subscription.id },
		data: {
			paymentToken: null,
			paymentTitle: null,
		},
	})
	return { response: {} }
}))
export default handler
