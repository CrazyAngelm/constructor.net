import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { Payment } from "@a2seven/yoo-checkout";
import { subscribe } from "@/lib/requests/subscription";
import { License } from "@prisma/client";

const prisma = usePrisma()
const handler = getDefaultHandler()

const addMont = (date: Date): Date => {
	return new Date(date.setMonth(date.getMonth() + 1))
}

interface INotification {
	type: string
	event: string,
	object: Payment,
}

handler.post(response(async (req, res) => {
	const payment = JSON.parse(req.body) as INotification
	console.log(payment)
	console.log(payment.event)
	if (payment.event.indexOf('payment') > -1 && payment.object) {
		const _payment = await prisma.payment.findUnique({
			where: {
				id: payment.object.id,
			}
		})

		if (_payment == null) {
			return { response: {} }
		}

		if (_payment.licenseId == -1) {
			const subscriptions = await prisma.subscription.findMany({
				where: { userId: _payment.userId, canceled: false }
			})

			subscriptions.forEach(async p => {
				await prisma.subscription.update({
					where: { id: p.id },
					data: {
						paymentToken: payment.object.payment_method.id,
						paymentTitle: payment.object.payment_method.title
					}
				})
			})

			return { response: {} }
		}

		const subscription = (await prisma.subscription.findMany({
			where: { userId: _payment.userId, canceled: false }
		}))?.find(p => p.licenseId == _payment.licenseId)

		if (payment.object.status === 'canceled') {
			await prisma.payment.delete({ where: { id: _payment.id } })
			if (subscription)
				await prisma.subscription.update({
					where: { id: subscription.id },
					data: { active: false }
				})
			return { response: {} }
		}
		if (payment.object.status === 'succeeded') {
			if (!subscription) {
				const cerated = await prisma.subscription.create({
					data: {
						userId: _payment.userId,
						licenseId: _payment.licenseId,
						active: true,
						lastPaymentId: _payment.id,
						startDate: new Date(),
						endDate: addMont(new Date()),
						paymentToken: payment.object.payment_method.id,
						paymentTitle: payment.object.payment_method.title,
						courses: await getCourses(_payment.licenseId)
					}
				})
			} else {
				subscription.active = true
				subscription.lastPaymentId = _payment.id
				subscription.endDate = addMont(subscription.endDate ?? new Date())
				await prisma.subscription.update({
					where: { id: subscription.id },
					data: subscription
				})
			}
		}
	}

	return { response: {} }
}))

const getCourses = async (licenseId: number)
	: Promise<string> => {

	const license = await prisma.license.findUnique({ where: { id: licenseId } })

	const licenseCourses = license?.courses ? JSON.parse(license.courses) as number[]
		: []

	const courses = await prisma.course.findMany({
		where: {
			id: {
				notIn: licenseCourses
			},
			deleted: false
		}
	})

	return JSON.stringify(courses.slice(0, license?.freeCourses).map(p => p.id))
}

export default handler
