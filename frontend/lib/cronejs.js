
const { CronJob } = require('cron')
const { PrismaClient } = require('@prisma/client')
const { checkout } = require('./yookassa/checkoutjs.js')     // этап-2
const prisma = new PrismaClient()

const GRACE_MS = 2 * 60 * 60 * 1000          // 2 часа после endDate
const PENDING_LOOKBACK_HRS = 48               // окна для reconcile / поиска «висящих»
const BILLING_PERIOD_DAYS = 30                 // если у тебя другой период — поменяй

function addDays(date, days) {
	const d = new Date(date)
	d.setDate(d.getDate() + days)
	return d
}

function periodKeyFromSub(sub) {
	const tag = sub.endDate ? sub.endDate.toISOString().slice(0, 10) : 'initial'
	return `sub:${sub.id}:${tag}`
}

class CronService {
	static init() {
		new CronJob(
			'0 0 0 * * *',
			() => this.check(),
			null,
			true,
			'Europe/Moscow'
		)
	}

	static async preflightReconcile(sub) {
		const since = new Date(Date.now() - PENDING_LOOKBACK_HRS * 60 * 60 * 1000)

		const last = await prisma.payment.findFirst({
			where: {
				userId: sub.userId,
				licenseId: sub.licenseId,
				confirmed: false,
				createdAt: { gte: since }
			},
			orderBy: { createdAt: 'desc' }
		})

		if (!last) return { handled: false }

		try {
			const remote = await checkout.getPayment(last.id) // <-- должен вернуть { status: 'succeeded' | 'canceled' | 'pending' | ... }

			if (!remote || !remote.status) return { handled: false }

			if (remote.status === 'succeeded') {
				await prisma.$transaction(async (tx) => {
					await tx.payment.update({
						where: { id: last.id },
						data: { confirmed: true }
					})

					const freshSub = await tx.subscription.findUnique({ where: { id: sub.id } })
					const base = freshSub.endDate && freshSub.endDate > new Date() ? freshSub.endDate : new Date()
					await tx.subscription.update({
						where: { id: sub.id },
						data: {
							endDate: addDays(base, BILLING_PERIOD_DAYS),
							lastPaymentId: last.id,
							active: true
						}
					})
				})

				return { handled: true } // уже всё продлили — новый платёж не нужен
			}

			if (remote.status === 'pending' || remote.status === 'waiting_for_capture') {
				return { handled: true }
			}

			return { handled: false }
		} catch (e) {
			return { handled: false }
		}
	}

	static async charge(sub) {
		const pre = await this.preflightReconcile(sub)
		if (pre.handled) return

		const idempotenceKey = periodKeyFromSub(sub)

		const payload = {
			amount: { value: `${sub.license.price}.00`, currency: 'RUB' },
			capture: true,
			payment_method_id: sub.paymentToken,
			description: `Подписка ${sub.license.name}, user ${sub.userId}`
		}

		try {
			const payment = await checkout.createPayment(payload, idempotenceKey)

			await prisma.payment.create({
				data: {
					id: payment.id,
					userId: sub.userId,
					amount: sub.license.price,
					licenseId: sub.licenseId
				}
			})

			if (payment.status === 'succeeded') {
				await prisma.$transaction(async (tx) => {
					await tx.payment.update({ where: { id: payment.id }, data: { confirmed: true } })

					const freshSub = await tx.subscription.findUnique({ where: { id: sub.id } })
					const base = freshSub.endDate && freshSub.endDate > new Date() ? freshSub.endDate : new Date()
					await tx.subscription.update({
						where: { id: sub.id },
						data: {
							endDate: addDays(base, BILLING_PERIOD_DAYS),
							lastPaymentId: payment.id,
							active: true
						}
					})
				})
			}

		} catch (err) {

			await prisma.subscription.update({
				where: { id: sub.id },
				data: { active: false }
			})
		}
	}

	static async deduplicate() {
		const dups = await prisma.subscription.findMany({
			where: { canceled: false },
			orderBy: [ { userId: 'asc' }, { endDate: 'desc' } ]
		})

		let lastKey = ''
		for (const s of dups) {
			const key = s.userId
			if (key === lastKey) {
				await prisma.subscription.update({
					where: { id: s.id },
					data: { active: false, canceled: true }
				})
			} else {
				lastKey = key
			}
		}
	}

	static async check() {

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
						await prisma.subscription.update({
							where: { id: sub.id },
							data: { active: false }
						})
					}
				}
			} catch (err) {
			}
		}

	}
}

module.exports = CronService
