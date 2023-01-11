import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { Payment } from "@a2seven/yoo-checkout";
import { subscribe } from "@/lib/requests/subscription";

const prisma = usePrisma()
const handler = getDefaultHandler()

interface INotification {
	type: string
	event: string,
	object: Payment,
}

handler.post(response(async (req, res) => {
	const payment = req.body as INotification
	if (payment.event.indexOf('payment') > -1 && payment.object && payment.object.status == 'succeeded') {
		const _payment = await prisma.payment.findUnique({
			where: {
				id: payment.object.id
			}
		})

		if (_payment == null) {
			console.log('error. _payment not found', payment)
			return { response: {} }
		}

		const subscription = (await prisma.subscription.findMany({
			where: { userId: _payment.id, canceled: false }
		}))?.find(p => p.licenseId == _payment.licenseId)

		if (!subscription) {
			await prisma.subscription.create({
				data: {
					userId: _payment.userId,
					licenseId: _payment.licenseId,
					active: true,
					lastPaymentId: _payment.id,
					endDate: new Date(Date.now() +
						new Date(0, 1, 0, 0, 0, 0, 0).getDate())
				}
			})
		} else {
			subscription.active = true;
			subscription.lastPaymentId = _payment.id,
				subscription.endDate = new Date((subscription.endDate?.getDate() ?? Date.now()) +
					new Date(0, 1, 0, 0, 0, 0, 0).getDate())
		}
	}

	return { response: {} }
}))

export default handler
