import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { Payment } from "@a2seven/yoo-checkout";
import { subscribe } from "@/lib/requests/subscription";
import { SubscribeReq } from "@/lib/dto/subscription";

const prisma = usePrisma()
const handler = getDefaultHandler()

const addDays = (date: Date, days: number): Date => {
	return new Date(date.setDate(date.getDate() + days))
}

handler.post(response(async (req, res) => {
	const body = JSON.parse(req.body) as SubscribeReq

	if (!body.userId || !body.licenseId) return { error: { code: 400, message: "Неверный запрос" } }

	const subscription = await prisma.subscription.findFirst({
		where: { userId: body.userId, canceled: false }
	})

	if (subscription) return { error: { code: 412, message: 'У данного пользователя уже есть активная подписка' } }

	const user = await prisma.user.findUnique({
		where: { id: body.userId }
	})

	if (!user) return { error: { code: 400, message: "Такого пользователя не сущетсвует" } }

	const license = await prisma.license.findUnique({
		where: { id: body.licenseId }
	})

	if (!license) return { error: { code: 400, message: "Такой лицензии не существует" } }

	const trial = await prisma.subscription.findFirst({
		where: { userId: user.id, license: { price: 0 } },
	})

	if (trial) return { error: { code: 413, message: 'Пользователь уже использовал пробный период' } }

	await prisma.subscription.create({
		data: {
			licenseId: body.licenseId,
			userId: user.id,
			endDate: addDays(new Date(), license.duration),
			courses: await getCourses(license.id)
		}
	})

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
