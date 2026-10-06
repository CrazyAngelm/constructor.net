import { getDefaultHandler } from '@/lib/api/apiHandler'
import { responseAuth } from '@/lib/api/response'
import { readJsonBody } from '@/lib/api/body'
import { getPrisma } from '@/lib/api/database'
import { ChangePaymentMethodReq, ChangePaymentMethodRes } from '@/lib/dto/subscription'
import { checkout, ICreatePayment } from '@/lib/yookassa/checkout'
import { Prisma } from '@prisma/client'
import { previewExternalFlowError, previewExternalFlowsRestricted } from '@/lib/preview'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.post(
	responseAuth(async (req, _res, userId) => {
		if (previewExternalFlowsRestricted()) return { error: previewExternalFlowError }
		const body = readJsonBody<ChangePaymentMethodReq>(req.body)
		if (!body?.subscriptionId) return { error: { code: 400 } }
		const result = await prisma
			.$transaction(async (tx: Prisma.TransactionClient) => {
				const sub = await tx.subscription.findUnique({
					where: { id: body.subscriptionId },
				})
				if (!sub || sub.userId !== userId) throw { code: 404, message: 'Subscription not found' }
				const payload: ICreatePayment = {
					amount: { value: '1.00', currency: 'RUB' },
					confirmation: { type: 'embedded' },
					capture: true,
					description: 'Payment method binding',
					save_payment_method: true,
				}
				const pay = await checkout.createPayment(payload, checkout.generateKey())
				const confirmationToken = pay.confirmation?.confirmation_token
				if (!confirmationToken) throw { code: 502, message: 'Payment confirmation is unavailable' }
				await tx.payment.create({
					data: {
						id: pay.id,
						userId,
						amount: 1,
						licenseId: sub.licenseId,
					},
				})
				return {
					confirmationToken,
					returnUrl: process.env.YOOCHECKOUT_REDIRECT_URL,
				} as ChangePaymentMethodRes
			})
			.catch(e => ({ error: e?.code ? e : { code: 500 } }))
		return 'error' in result ? result : { response: result }
	})
)
export default handler
