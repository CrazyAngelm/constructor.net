import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { ChangePaymentMethodReq, ChangePaymentMethodRes, Subscription } from "@/lib/dto/subscription";
import { ICreatePayment, YooCheckout } from "@a2seven/yoo-checkout";
import { v4 } from "uuid";

const prisma = usePrisma()
const handler = getDefaultHandler()


handler.post(response(async (req, res) => {
	const body = JSON.parse(req.body) as ChangePaymentMethodReq

	if (!body.userId || !body.subscriptionId) return { error: { code: 400 } }

	const user = await prisma.user.findUnique({ where: { id: body.userId } })
	const subscription = await prisma.subscription.findUnique({ where: { id: body.subscriptionId } })

	if (!user || !subscription) return { error: { code: 400 } }

	const checkout = new YooCheckout({
		shopId: process.env.YOOCHECKOUT_SHOP_ID ?? "",
		secretKey: process.env.YOOCHECKOUT_KEY ?? ""
	})

	const idempotentKey = v4()

	const createPayload: ICreatePayment = {
		amount: {
			value: `1.00`,
			currency: 'RUB'
		},
		confirmation: {
			type: 'embedded'
		},
		capture: true,
		description: 'Привязка нового способа оплаты',
		save_payment_method: true
	}
	try {
		const payment = await checkout.createPayment(createPayload, idempotentKey);

		await prisma.payment.create({
			data: {
				id: payment.id,
				userId: user.id,
				amount: 1,
				licenseId: -1
			}
		})

		return {
			response: {
				confirmationToken: payment.confirmation.confirmation_token,
				returnUrl: process.env.YOOCHECKOUT_REDIRECT_URL
			} as ChangePaymentMethodRes
		}
	} catch (err) {
		console.log(err);
		return { error: { code: 415, message: JSON.stringify(err) } }
	}
}))

export default handler
