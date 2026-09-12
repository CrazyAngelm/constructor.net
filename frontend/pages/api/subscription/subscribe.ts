import { getDefaultHandler } from '@/lib/api/apiHandler'
import { responseAuth } from '@/lib/api/response'
import { readJsonBody } from '@/lib/api/body'
import { getPrisma } from '@/lib/api/database'
import { checkout, ICreatePayment } from '@/lib/yookassa/checkout'
import { SubscribeReq, SubscribeRes } from '@/lib/dto/subscription'
import { ScopeEnum } from '@/lib/dto/users'
import { Prisma } from '@prisma/client'
import { previewExternalFlowError, previewExternalFlowsRestricted } from '@/lib/preview'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.post(
	responseAuth(async (req, _res, userId) => {
		if (previewExternalFlowsRestricted()) return { error: previewExternalFlowError }
		const body = readJsonBody<SubscribeReq>(req.body)
		if (!body?.licenseId) {
			return { error: { code: 400, message: 'Invalid request' } }
		}
		const result = await prisma
			.$transaction(async (tx: Prisma.TransactionClient) => {
				const existed = await tx.subscription.findFirst({
					where: { userId, canceled: false },
				})
				if (existed && existed.licenseId !== 1) {
					throw { code: 412, message: 'Active subscription already exists' }
				}
				const user = await tx.user.findUnique({
					where: { id: userId },
					include: { scopes: { include: { scope: true } } },
				})
				if (!user) throw { code: 400, message: 'User not found' }
				const license = await tx.license.findUnique({
					where: { id: body.licenseId },
				})
				if (!license) throw { code: 400, message: 'License not found' }
				const isDev = ScopeEnum.Contains(
					ScopeEnum.developer,
					user.scopes.map(p => p.scope.value)
				)
				const price = isDev ? 2 : license.price
				const tariffName = isDev ? `${license.name} (developer)` : license.name
				const payload: ICreatePayment = {
					amount: { value: `${price}.00`, currency: 'RUB' },
					confirmation: { type: 'embedded' },
					capture: true,
					description: `Subscription: ${tariffName}, user ${user.id}`,
					save_payment_method: true,
				}
				const payment = await checkout.createPayment(
					payload,
					checkout.generateKey()
				)
				const confirmationToken = payment.confirmation?.confirmation_token
				if (!confirmationToken) throw { code: 502, message: 'Payment confirmation is unavailable' }
				await tx.payment.create({
					data: {
						id: payment.id,
						userId: user.id,
						amount: price,
						licenseId: license.id,
					},
				})
				return {
					licenseId: license.id,
					confirmationToken,
					returnUrl: process.env.YOOCHECKOUT_REDIRECT_URL,
				} as SubscribeRes
			})
			.catch((err) => {
				if (err?.code) return { error: err }
				return { error: { code: 500, message: 'Unexpected error' } }
			})
		if ('error' in result) return result
		return { response: result }
	})
)
export default handler
