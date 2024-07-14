

class CroneClass {
	static prisma

	static Init() {
		const CronJob = require('cron').CronJob
		const PrismaClient = require('prisma/prisma-client').PrismaClient

		this.prisma = new PrismaClient()
		console.log("init")
		const job = new CronJob("00 * * * * *",
			this.Check,
			null, true)
	}

	static async Payment(license, userId, paymentId) {
		const YooCheckout = require('@a2seven/yoo-checkout').YooCheckout
		const v4 = require('uuid').v4


		const checkout = new YooCheckout({
			shopId: process.env.YOOCHECKOUT_SHOP_ID ?? "",
			secretKey: process.env.YOOCHECKOUT_KEY ?? ""
		})

		const idempotentKey = v4()

		const createPayload = {
			amount: {
				value: `${license.price}.00`,
				currency: 'RUB'
			},
			capture: false,
			payment_method_id: paymentId,
			description: 'Подписка, тариф: ' + license.name
		}
		const payment = await checkout.createPayment(createPayload, idempotentKey)
		console.log(payment)
		await CroneClass.prisma.payment.create({
			data: {
				id: payment.id,
				userId: userId,
				amount: license.price,
				licenseId: license.id
			}
		})
		const capture = await checkout.capturePayment(payment.id, {})
		console.log(capture)
	}

	static async Check() {
		const subscription = await CroneClass.prisma.subscription.findMany({
			where: {
				userId: 'clo8ff9dj0002flstdpsliglu',
				canceled: false,
				active: true
			},
			include: {
				lastPayment: true,
				license: true
			}
		})



		subscription.forEach(async p => {
			console.log(`Check user ${p.userId}, endDate: ${p.endDate}`)
			/* if (!p.endDate) return
			if (new Date() > p.endDate) {
				if (p.paymentToken)
					CroneClass.Payment(p.license, p.userId, p.paymentToken)
				else
					await CroneClass.prisma.subscription.update({
						where: { id: p.id },
						data: {
							active: false
						}
					})
			} */
		})
	}
}

module.exports = CroneClass
