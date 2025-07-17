// /scripts/cronejs.js   (оставляем CommonJS, чтобы не ломать существующий require)

const { CronJob } = require('cron')
const { PrismaClient } = require('@prisma/client')
const { checkout } = require('./yookassa/checkoutjs.js')     // этап-2
const prisma = new PrismaClient()

class CronService {
	/** Запуск cron-задачи каждые сутки в 00:00 (Europe/Moscow) */
	static init() {
		new CronJob(
			'0 0 0 * * *',
			() => this.check(),
			null,
			true,
			'Europe/Moscow'
		)
		console.log('[Cron] subscription check scheduled')
	}

	/** Создать и захватить платёж */
	static async charge(sub) {
		const key = checkout.generateKey()

		const payload = {
			amount: { value: `${sub.license.price}.00`, currency: 'RUB' },
			capture: true,
			payment_method_id: sub.paymentToken,
			description: `Подписка ${sub.license.name}, user ${sub.userId}`
		}

		try {
			const payment = await checkout.createPayment(payload, key)

			// сохраняем платёж (await важно, иначе дубликаты)
			await prisma.payment.create({
				data: {
					id: payment.id,
					userId: sub.userId,
					amount: sub.license.price,
					licenseId: sub.licenseId
				}
			})

			console.log(`[Cron] charge OK sub:${sub.id} pay:${payment.id}`)
		} catch (err) {
			console.error('[Cron] charge FAILED', err)

			// карта отклонена → блокируем подписку
			await prisma.subscription.update({
				where: { id: sub.id },
				data: { active: false }
			})
		}
	}

	static async deduplicate() {
		// все незакрытые подписки, отсортированы по endDate (новая первая)
		const dups = await prisma.subscription.findMany({
			where: { canceled: false },
			orderBy: [ { userId: 'asc' }, { endDate: 'desc' } ]
		})

		let lastKey = ''
		for (const s of dups) {
			const key = s.userId
			if (key === lastKey) {
				// дубликат => переводим в canceled
				await prisma.subscription.update({
					where: { id: s.id },
					data: { active: false, canceled: true }
				})
			} else {
				lastKey = key
			}
		}
	}

	/** Проверка всех активных подписок */
	static async check() {
		console.log('[Cron] start check')

		await this.deduplicate();

		const subs = await prisma.subscription.findMany({
			where: { canceled: false, active: true },
			include: { license: true }
		})

		for (const sub of subs) {
			try {
				if (!sub.endDate) continue

				if (new Date() > sub.endDate) {
					if (sub.paymentToken) {
						await this.charge(sub)
					} else {
						// нет привязанной карты → выключаем
						await prisma.subscription.update({
							where: { id: sub.id },
							data: { active: false }
						})
					}
				}
			} catch (err) {
				console.error('[Cron] sub error', sub.id, err)
			}
		}

		console.log('[Cron] check finished')
	}
}

module.exports = CronService
