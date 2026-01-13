import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { ChangeCourseReq } from "@/lib/dto/subscription";
const prisma = usePrisma()
const handler = getDefaultHandler()
handler.post(response(async (req, res) => {
	const body = JSON.parse(req.body) as ChangeCourseReq
	if (!body.userId || !body.coursesId) return { error: { code: 400 } }
	const subscription = await prisma.subscription.findFirst({
		where: { userId: body.userId, canceled: false },
		include: { license: true }
	})
	if (!subscription) return { error: { code: 412, message: 'Нет активных подписок' } }
	const data = await prisma.subscription.update({
		where: { id: subscription.id },
		data: {
			courses: JSON.stringify(body.coursesId.slice(0,
				subscription.license.freeCourses))
		}
	})
	return { response: data }
}))
export default handler
