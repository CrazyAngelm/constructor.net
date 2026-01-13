import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { usePrisma } from '@/lib/api/database'
import { ChangePaymentMethodReq, ChangePaymentMethodRes, Subscription } from '@/lib/dto/subscription'
import { ICreatePayment, YooCheckout } from '@a2seven/yoo-checkout'
import { v4 } from 'uuid'
const prisma = usePrisma()
const handler = getDefaultHandler()
handler.post(response(async (req, res) => {
	const body = JSON.parse(req.body) as ChangePaymentMethodReq
	if (!body.userId || !body.subscriptionId) return { error: { code: 400 } }
	const user = await prisma.user.findUnique({ where: { id: body.userId } })
	const subscription = await prisma.subscription.findUnique({ where: { id: body.subscriptionId } })
	if (!user || !subscription) return { error: { code: 400 } }
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
