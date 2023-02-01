import { ICreatePayment, YooCheckout } from '@a2seven/yoo-checkout'
import { License, Subscription } from '@prisma/client'
import { CronJob } from 'cron'
import { v4 } from 'uuid'
import { usePrisma } from './api/database'

const prisma = usePrisma()

const payment = async (license: License, userId: string, paymentId: string) => {
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
		capture: true,
		payment_method_id: paymentId,
		description: 'Подписка, тариф: ' + license.name
	}
	const payment = await checkout.createPayment(createPayload, idempotentKey);

	await prisma.payment.create({
		data: {
			id: payment.id,
			userId: userId,
			amount: license.price,
			licenseId: license.id
		}
	})
}

const CheckSubscribtion = async () => {
	const subscription = await prisma.subscription.findMany({
		where: {
			canceled: false
		},
		include: {
			lastPayment: true,
			license: true
		}
	})

	subscription.forEach(async p => {
		if (!p.endDate) return
		if (new Date() > p.endDate) {
			if (p.paymentToken)
				payment(p.license, p.userId, p.paymentToken)
			else
				await prisma.subscription.update({
					where: { id: p.id },
					data: {
						active: false
					}
				})
		}
	});
}


export default class CroneClass {
	static Check() {
		console.log("check")
	}
}
