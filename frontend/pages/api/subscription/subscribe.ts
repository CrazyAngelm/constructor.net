import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { encodeBase64, hash } from 'bcryptjs';
import { compare } from 'bcryptjs'
import { getRegistrationHtml } from "@/lib/mailer/registration";
import { optionsWithFrom, sendMail } from "@/lib/mailer/mailer";
import { YooCheckout, ICreatePayment } from '@a2seven/yoo-checkout';
import { v4 } from 'uuid'
import { SubscribeReq, SubscribeRes } from "@/lib/dto/subscription";
import { ScopeEnum } from "@/lib/dto/users";

const prisma = usePrisma()
const handler = getDefaultHandler()


handler.post(response(async (req, res) => {
	const body = JSON.parse(req.body)


	if (!body.userId || !body.licenseId) return { error: { code: 400, message: "Неверный запрос" } }

	const subscription = await prisma.subscription.findFirst({
		where: { userId: body.userId, canceled: false }
	})

	if (subscription && subscription.licenseId !== 1) return { error: { code: 412, message: 'У данного пользователя уже есть активная подписка' } }

	const user = await prisma.user.findUnique({
		where: { id: body.userId },
		include: {scopes: {
			include: {
				scope: true
			}
		}}
	})

	if (!user) return { error: { code: 400, message: "Такого пользователя не сущетсвует" } }

	const license = await prisma.license.findUnique({
		where: { id: body.licenseId }
	})

	if (!license) return { error: { code: 400, message: "Такой лицензии не существует" } }

	const checkout = new YooCheckout({
		shopId: process.env.YOOCHECKOUT_SHOP_ID ?? "",
		secretKey: process.env.YOOCHECKOUT_KEY ?? ""
	})

	const idempotentKey = v4()

	if(ScopeEnum.Contains(ScopeEnum.developer, user.scopes.map(p => p.scope.value))){
		license.name += "(developer)"
		license.price = 1
	}

	const createPayload: ICreatePayment = {
		amount: {
			value: `${license.price}.00`,
			currency: 'RUB'
		},
		confirmation: {
			type: 'embedded'
		},
		capture: true,
		description: `Подписка, тариф:  + ${license.name}, user: ${user.id}`,
		save_payment_method: true
	}
	try {
		const payment = await checkout.createPayment(createPayload, idempotentKey);

		await prisma.payment.create({
			data: {
				id: payment.id,
				userId: user.id,
				amount: license.price,
				licenseId: license.id
			}
		})

		return {
			response: {
				licenseId: body.licenseId,
				confirmationToken: payment.confirmation.confirmation_token,
				returnUrl: process.env.YOOCHECKOUT_REDIRECT_URL
			} as SubscribeRes
		}
	} catch (err) {
		console.log(err);
		return { error: { code: 415, message: JSON.stringify(err) } }
	}
}))

export default handler
