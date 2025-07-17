/* /api/subscription/subscribe.ts
	 — новая “чистая” реализация:
	 • единый сервис checkout (этап 2)
	 • вся логика в одной $transaction → никаких «висящих» записей
	 • idempotency-key через checkout.generateKey()
	 • placeholder-подписка (active:false) создаётся сразу
*/

import { getDefaultHandler } from "@/lib/api/apiHandler"
import { response } from "@/lib/api/response"
import { usePrisma } from "@/lib/api/database"
import { checkout, ICreatePayment } from "@/lib/yookassa/checkout"
import { SubscribeReq, SubscribeRes } from "@/lib/dto/subscription"
import { ScopeEnum } from "@/lib/dto/users"
import { Prisma, PrismaClient } from "@prisma/client"

const prisma = usePrisma()
const handler = getDefaultHandler()

handler.post(
	response(async (req, _res) => {
		const body = JSON.parse(req.body) as SubscribeReq
		if (!body.userId || !body.licenseId)
			return { error: { code: 400, message: "Неверный запрос" } }

		/* атомарная часть */
		const result = await prisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
				/* 1. нет ли уже действующей подписки? */
				const existed = await tx.subscription.findFirst({
					where: { userId: body.userId, canceled: false }
				})
				if (existed && existed.licenseId !== 1)
					throw { code: 412, message: "У пользователя уже есть активная подписка" }

				/* 2. подтягиваем пользователя + лицензии */
				const user = await tx.user.findUnique({
					where: { id: body.userId },
					include: { scopes: { include: { scope: true } } }
				})
				if (!user) throw { code: 400, message: "Пользователь не найден" }

				const license = await tx.license.findUnique({
					where: { id: body.licenseId }
				})
				if (!license) throw { code: 400, message: "Лицензия не найдена" }

				/* 3. developer-скидка */
				const isDev = ScopeEnum.Contains(
					ScopeEnum.developer,
					user.scopes.map((p) => p.scope.value)
				)
				const price = isDev ? 1 : license.price
				const tariffName = isDev ? `${license.name} (developer)` : license.name

				/* 4. создаём платёж */
				const payload: ICreatePayment = {
					amount: { value: `${price}.00`, currency: "RUB" },
					confirmation: { type: "embedded" },
					capture: true, // подтвердим в webhook
					description: `Подписка: ${tariffName}, user ${user.id}`,
					save_payment_method: true
				}
				const payment = await checkout.createPayment(
					payload,
					checkout.generateKey()
				)

				/* 5. сохраняем платёж - “черновик” подписки */
				await tx.payment.create({
					data: {
						id: payment.id,
						userId: user.id,
						amount: price,
						licenseId: license.id
					}
				})

				return {
					licenseId: license.id,
					confirmationToken: payment.confirmation.confirmation_token,
					returnUrl: process.env.YOOCHECKOUT_REDIRECT_URL
				} as SubscribeRes
			}
		).catch((err) => {
			/* оборачиваем кастомную ошибку в reply-формат */
			if (err?.code) return { error: err }
			console.error(err)
			return { error: { code: 500, message: "Ошибка сервера" } }
		})

		/* 6. ответ */
		if ("error" in result) return result
		return { response: result }
	})
)

export default handler
