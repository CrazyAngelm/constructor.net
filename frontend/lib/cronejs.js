

class CroneClass {
	static prisma

	static Init() {
		const CronJob = require('cron').CronJob
		const PrismaClient = require('prisma/prisma-client').PrismaClient

		this.prisma = new PrismaClient()
		console.log("init")
		const job = new CronJob("00 00 00 * * *",
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
			capture: true,
			payment_method_id: paymentId,
			description: 'Подписка, тариф: ' + license.name
		}
		const payment = await checkout.createPayment(createPayload, idempotentKey)

		await CroneClass.prisma.payment.create({
			data: {
				id: payment.id,
				userId: userId,
				amount: license.price,
				licenseId: license.id
			}
		})
	}

	static async Check() {
		console.log('Check')

		const subscription = await CroneClass.prisma.subscription.findMany({
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
					CroneClass.Payment(p.license, p.userId, p.paymentToken)
				else
					await CroneClass.prisma.subscription.update({
						where: { id: p.id },
						data: {
							active: false
						}
					})
			}
		})
	}
}

module.exports = CroneClass
