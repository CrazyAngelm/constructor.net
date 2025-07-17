import type { NextApiRequest, NextApiResponse } from 'next'
import { buffer } from 'micro'
import { Prisma, PrismaClient, Subscription } from '@prisma/client'
import { checkout } from '@/lib/yookassa/checkout.js'

export const config = { api: { bodyParser: false } }

const prisma = new PrismaClient()

/** Утилита: +1 месяц к дате */
const addMonth = (d: Date) => new Date(d.setMonth(d.getMonth() + 1))

/** Payload YooKassa */
interface NotificationPayment {
	event: string
	object: {
		id: string
		status: 'waiting_for_capture' | 'succeeded' | 'canceled' | string
		amount: { value: string }
		payment_method: { id: string; title: string }
	}
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') return res.status(405).end()

	/* 1. читаем «сырое» тело → сразу отдаём 200 */
	const raw = await buffer(req)
	res.status(200).end()

	/* 2. асинхронная тяжёлая обработка */
	setImmediate(async () => {
		/* const sig = (req.headers['x-content-hmac'] as string) ?? ''
		if (!checkout.verifyWebhookSignature(raw.toString(), sig)) return */

		const n = JSON.parse(raw.toString()) as NotificationPayment
		if (!n.event.startsWith('payment')) return

		const p = n.object
		const dbPay = await prisma.payment.findUnique({ where: { id: p.id } })
		if (!dbPay || dbPay.confirmed) return                     // дубликат/неизвестный

		const isBindCard = p.amount.value === '1.00'

		try {
			await prisma.$transaction(async (tx) => {
				switch (p.status) {
					case 'waiting_for_capture':
						await checkout.capturePayment(p.id) // авторизация → capture
						return

					case 'succeeded':
						if (isBindCard) {
							/* обновляем токен оплаты во всех активных подписках */
							await tx.subscription.updateMany({
								where: { userId: dbPay.userId, canceled: false },
								data: {
									paymentToken: p.payment_method.id,
									paymentTitle: p.payment_method.title
								}
							})
						} else {
							await handleSucceeded(tx, dbPay, p)
						}
						await tx.payment.update({ where: { id: dbPay.id }, data: { confirmed: true } })
						return

					case 'canceled':
						await tx.subscription.updateMany({
							where: { userId: dbPay.userId, licenseId: dbPay.licenseId, canceled: false },
							data: { active: false }
						})
						return
				}
			})
		} catch (err) {
			console.error('Webhook processing error', err)
		}

	})
	return
}

/** «Оплачено» — создать/продлить подписку */
async function handleSucceeded(
	tx: Prisma.TransactionClient,
	pay: { userId: string; licenseId: number; id: string },
	p: NotificationPayment[ 'object' ]
) {
	let sub = await tx.subscription.findFirst({
		where: { userId: pay.userId, licenseId: pay.licenseId, canceled: false }
	})

	if (!sub) {
		sub = await tx.subscription.create({
			data: {
				userId: pay.userId,
				licenseId: pay.licenseId,
				active: true,
				startDate: new Date(),
				endDate: addMonth(new Date()),
				lastPaymentId: pay.id,
				paymentToken: p.payment_method.id,
				paymentTitle: p.payment_method.title,
				courses: await getCourses(tx, pay.licenseId)
			}
		})
	} else {
		await tx.subscription.update({
			where: { id: sub.id },
			data: {
				active: true,
				endDate: addMonth(sub.endDate ?? new Date()),
				lastPaymentId: pay.id
			}
		})
	}

	await tx.subscription.updateMany({
		where: {
			userId: pay.userId,
			id: { not: sub?.id ?? 0 },
			canceled: false
		},
		data: { active: false, canceled: true }
	})
}

/** Получить перечень бесплатных курсов по лицензии */
async function getCourses(tx: Prisma.TransactionClient, licenseId: number): Promise<string> {
	const lic = await tx.license.findUnique({ where: { id: licenseId } })
	const excluded = lic?.courses ? (JSON.parse(lic.courses) as number[]) : []
	const courses = await tx.course.findMany({
		where: { id: { notIn: excluded }, deleted: false }
	})
	return JSON.stringify(courses.slice(0, lic?.freeCourses ?? 0).map((c) => c.id))
}
