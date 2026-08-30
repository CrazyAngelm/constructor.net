import { Prisma } from '@prisma/client'
import { checkout } from '@/lib/yookassa/checkout'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { Payment } from '@/lib/yookassa/checkout'
import { getPrisma } from '@/lib/api/database'
import { previewExternalFlowError, previewExternalFlowsRestricted } from '@/lib/preview'
const prisma = getPrisma()
const handler = getDefaultHandler()
const addMonth = (d: Date) => new Date(d.setMonth(d.getMonth() + 1))
interface NotificationPayment {
	type: string;
	event: string;
	object: { id?: string };
}
handler.post(
	response(async (req) => {
		if (previewExternalFlowsRestricted()) return { error: previewExternalFlowError }
		const n = req.body as NotificationPayment
		if (!n?.event?.startsWith('payment') || !n.object?.id) {
			return { error: { code: 400, message: 'Invalid payment notification' } }
		}
		const p = await checkout.getPayment(n.object.id)
		const dbPay = await prisma.payment.findUnique({ where: { id: p.id } })
		if (!dbPay) return { error: { code: 404, message: 'Payment not found' } }
		if (dbPay.confirmed) return { response: {} }
		if (p.amount.currency !== 'RUB' || Number(p.amount.value) !== dbPay.amount) {
			return { error: { code: 400, message: 'Payment amount mismatch' } }
		}
		const isBindCard = p.amount.value === '1.00'
		if (p.status === 'waiting_for_capture') {
			await checkout.capturePayment(p.id)
			return { response: {} }
		}
		if (p.status !== 'succeeded' && p.status !== 'canceled') return { response: {} }

		await prisma.$transaction(async (tx) => {
			await tx.$queryRaw(Prisma.sql`SELECT id FROM Payment WHERE id = ${dbPay.id} FOR UPDATE`)
			const lockedPayment = await tx.payment.findUnique({ where: { id: dbPay.id } })
			if (!lockedPayment || lockedPayment.confirmed) return

			if (p.status === 'succeeded') {
				if (!p.payment_method?.id) throw new Error('YooKassa payment method is missing')
				if (isBindCard) {
					await tx.subscription.updateMany({
						where: { userId: lockedPayment.userId, canceled: false },
						data: {
							paymentToken: p.payment_method.id,
							paymentTitle: p.payment_method.title,
						},
					})
				} else {
					await handleSucceeded(tx, lockedPayment, p)
				}
			} else {
				await tx.subscription.updateMany({
					where: {
						userId: lockedPayment.userId,
						licenseId: lockedPayment.licenseId,
						canceled: false,
					},
					data: { active: false },
				})
			}

			await tx.payment.update({
				where: { id: lockedPayment.id },
				data: { confirmed: true },
			})
		})
		return { response: {} }
	})
)
async function handleSucceeded(
	tx: Prisma.TransactionClient,
	pay: { userId: string; licenseId: number; id: string },
	p: Payment
) {
	let sub = await tx.subscription.findFirst({
		where: { userId: pay.userId, licenseId: pay.licenseId, canceled: false },
	})
	if (!sub) {
		if (!p.payment_method?.id) throw new Error('YooKassa payment method is missing')
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
				courses: await getCourses(tx, pay.licenseId),
			},
		})
	} else {
		await tx.subscription.update({
			where: { id: sub.id },
			data: {
				active: true,
				endDate: addMonth(sub.endDate ?? new Date()),
				lastPaymentId: pay.id,
			},
		})
	}
	await tx.subscription.updateMany({
		where: {
			userId: pay.userId,
			id: { not: sub?.id ?? 0 },
			canceled: false,
		},
		data: { active: false, canceled: true },
	})
}
async function getCourses(
	tx: Prisma.TransactionClient,
	licenseId: number
): Promise<string> {
	const lic = await tx.license.findUnique({ where: { id: licenseId } })
	const excluded = lic?.courses ? (JSON.parse(lic.courses) as number[]) : []
	const courses = await tx.course.findMany({
		where: { id: { notIn: excluded }, deleted: false },
	})
	return JSON.stringify(
		courses.slice(0, lic?.freeCourses ?? 0).map(c => c.id)
	)
}
export default handler
