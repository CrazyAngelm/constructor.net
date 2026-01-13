import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { usePrisma } from '@/lib/api/database'
import { ChangePaymentMethodReq, ChangePaymentMethodRes } from '@/lib/dto/subscription'
import { checkout, ICreatePayment } from '@/lib/yookassa/checkout'
import { Prisma } from '@prisma/client'
const prisma = usePrisma()
const handler = getDefaultHandler()
handler.post(
	response(async (req) => {
		const body = JSON.parse(req.body) as ChangePaymentMethodReq
		if (!body.userId || !body.subscriptionId) return { error: { code: 400 } }
		const result = await prisma
			.$transaction(async (tx: Prisma.TransactionClient) => {
				if (!body.userId || !body.subscriptionId)
					throw { code: 404, message: 'Invalid request' }
				const sub = await tx.subscription.findUnique({
					where: { id: body.subscriptionId },
				})
				if (!sub) throw { code: 404, message: 'Subscription not found' }
				const payload: ICreatePayment = {
					amount: { value: '1.00', currency: 'RUB' },
					confirmation: { type: 'embedded' },
					capture: true,
					description: 'Payment method binding',
					save_payment_method: true,
				}
				const pay = await checkout.createPayment(payload, checkout.generateKey())
				await tx.payment.create({
					data: {
						id: pay.id,
						userId: body.userId,
						amount: 1,
						licenseId: sub.licenseId,
					},
				})
				return {
					confirmationToken: pay.confirmation.confirmation_token,
					returnUrl: process.env.YOOCHECKOUT_REDIRECT_URL,
				} as ChangePaymentMethodRes
			})
			.catch(e => ({ error: e?.code ? e : { code: 500 } }))
		return 'error' in result ? result : { response: result }
	})
)
export default handler
