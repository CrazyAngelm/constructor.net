import { Prisma, PrismaClient } from '@prisma/client'
import { checkout } from '@/lib/yookassa/checkout'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { Payment } from '@a2seven/yoo-checkout'

const prisma = new PrismaClient()
const handler = getDefaultHandler();

/** Утилита: +1 месяц к дате */
const addMonth = (d: Date) => new Date(d.setMonth(d.getMonth() + 1))

/** Payload YooKassa */
interface NotificationPayment {
	type: string
	event: string
	object: Payment
}

handler.post(response(async (req, res) => {
	const n = req.body as NotificationPayment

	if (!n.event.startsWith('payment')) return {}

	const p = n.object
	const dbPay = await prisma.payment.findUnique({ where: { id: p.id } })

	if (!dbPay || dbPay.confirmed) return {}                    // дубликат/неизвестный

	await prisma.payment.update({ where: { id: dbPay.id }, data: { confirmed: true } })

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

					return

				case 'canceled':
					await tx.subscription.updateMany({
						where: { userId: dbPay.userId, licenseId: dbPay.licenseId, canceled: false },
						data: { active: false }
					})
					return
			}
			return
		})
	} catch (err) {
		console.error('Webhook processing error', err)
	}
	return {}
}))

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


export default handler;
