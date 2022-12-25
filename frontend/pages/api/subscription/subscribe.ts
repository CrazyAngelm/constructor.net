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

const prisma = usePrisma()
const handler = getDefaultHandler()


const checkPayment = async (checkout: YooCheckout, paymentId: string,
	userId: string, licenseId: number) => {
	try {
		const payment = await checkout.getPayment(paymentId)
		console.log("check ", payment);
		if (payment.status != 'succeeded' && payment.status != 'canceled')
			setInterval(() => checkPayment(checkout, paymentId, userId, licenseId), 1000)
		else {
			const subscription = await prisma.subscription.create({
				data: {
					userId: userId,
					licenseId: licenseId,
					active: true
				}
			})

			const pm = await prisma.payment.create({
				data: {
					userId: userId,
					amount: Number(parseFloat(payment.amount.value)),
					createdAt: Date(),
					subscriptionId: subscription.id
				}
			})

			prisma.subscription.update({
				where: { id: subscription.id },
				data: { lastPaymentId: pm.id }
			})

		}
	} catch (err) {
		console.log("check error", err)
	}
}

handler.post(response(async (req, res) => {
	const body = JSON.parse(req.body)

	console.log()
	console.log(body.userId)

	console.log("user:", body.userId, " license: ", body.licenseId)
	if (!body.userId || !body.licenseId) return { error: { code: 400, message: "Неверный запрос" } }

	const user = await prisma.user.findUnique({
		where: { id: body.userId }
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

	const createPayload: ICreatePayment = {
		amount: {
			value: `${license.price}.00`,
			currency: 'RUB'
		},
		confirmation: {
			type: 'embedded'
		},
		capture: true,
		description: 'Подписка, тариф: ' + license.name,
		save_payment_method: true
	}
	try {
		const payment = await checkout.createPayment(createPayload, idempotentKey);
		console.log(payment);
		//heckPayment(checkout, payment.id, body.userId, body.licenseId)
		return {
			response: {
				licenseId: body.licenseId,
				confirmationToken: payment.confirmation.confirmation_token,
				returnUrl: 'http://localhost'
			} as SubscribeRes
		}
	} catch (err) {
		console.log(err);
		return { error: { code: 415, message: JSON.stringify(err) } }
	}

	var j = '{ "amount": { "value": "2.00", "currency": "RUB" }, "confirmation": { "type": "embedded","locale": "en_US"},"capture": false, "description": "Заказ №73"}'
	console.log(j)
	fetch("https://api.yookassa.ru/v3/payments", {
		body: j,
		headers: {
			"Authorization": 'Basic ' + Buffer.from('884508' + ':' + 'test_3etiMD4uJEYSuBxCRqTZ7wLD8hPV-qx0kSFAB1_Dtnw').toString('base64'),
			"Content-Type": "application/json",
			"Idempotence-Key": "rtyhghn",
		},
		method: 'POST',

	}).then(async p => {
		console.log("sucess")

		try {
			const json = await p.json()
			console.log(json)
			/* const checkout = (window as any).YooMoneyCheckoutWidget({
				confirmation_token: json.confirmation.confirmation_token,
				return_url: 'https://labstudio-inc.ru',
				customization: {
					modal: true
				},
				error_callback: (error: any) => {
					console.log("error vidjet")
					console.log(error)
				}
			})
			checkout.render().then(() => {
				console.log("sucess render")
			}).catch(() => console.log("error render")) */
		} catch {
			console.log("undefined json")
			console.log(p)
		}

	}).catch(p => {
		console.log("error")
		console.log(p)
	})
	return {}
}))

export default handler
