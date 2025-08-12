// /scripts/cronejs.js   (оставляем CommonJS, чтобы не ломать существующий require)

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
	// Идемпотентный ключ «подписка + дата периода»
	const tag = sub.endDate ? sub.endDate.toISOString().slice(0, 10) : 'initial'
	return `sub:${sub.id}:${tag}`
}

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

	/** Быстрая сверка последнего незакрытого платежа перед новым списанием */
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
				// отмечаем локально как подтверждённый и продлеваем период (если вебхук потерялся)
				await prisma.$transaction(async (tx) => {
					await tx.payment.update({
						where: { id: last.id },
						data: { confirmed: true }
					})

					// актуальная подписка пользователя под эту лицензию
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

				console.log(`[Cron] preflight: confirmed lost webhook pay:${last.id} sub:${sub.id}`)
				return { handled: true } // уже всё продлили — новый платёж не нужен
			}

			if (remote.status === 'pending' || remote.status === 'waiting_for_capture') {
				// ждём — новый платёж не создаём
				console.log(`[Cron] preflight: pending pay:${last.id} sub:${sub.id}, skip charge`)
				return { handled: true }
			}

			// canceled/failed — ничего не делаем, позволяем создать новый платёж
			return { handled: false }
		} catch (e) {
			console.warn('[Cron] preflight retrievePayment failed', last.id, e?.message || e)
			// при ошибке не блокируем чардж
			return { handled: false }
		}
	}

	/** Создать и захватить платёж */
	static async charge(sub) {
		// быстрая сверка: если вчерашний платёж уже успешен/в процессе — не чарджим
		const pre = await this.preflightReconcile(sub)
		if (pre.handled) return

		// детерминированный идемпотентный ключ на период
		const idempotenceKey = periodKeyFromSub(sub)

		const payload = {
			amount: { value: `${sub.license.price}.00`, currency: 'RUB' },
			capture: true,
			payment_method_id: sub.paymentToken,
			description: `Подписка ${sub.license.name}, user ${sub.userId}`
		}

		try {
			const payment = await checkout.createPayment(payload, idempotenceKey)

			// сохраняем платёж (await важно, иначе дубликаты)
			await prisma.payment.create({
				data: {
					id: payment.id,
					userId: sub.userId,
					amount: sub.license.price,
					licenseId: sub.licenseId
				}
			})

			// если ЮKassa вернула сразу succeeded (бывает при capture=true) — сразу фиксируем и продлеваем
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
				console.log(`[Cron] payment succeeded`)
			}

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
