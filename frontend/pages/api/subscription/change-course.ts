import { getDefaultHandler } from '@/lib/api/apiHandler'
import { responseAuth } from '@/lib/api/response'
import { readJsonBody } from '@/lib/api/body'
import { getPrisma } from '@/lib/api/database'
import { ChangeCourseReq } from '@/lib/dto/subscription'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.post(responseAuth(async (req, _res, userId) => {
	const body = readJsonBody<ChangeCourseReq>(req.body)
	if (!body?.coursesId || !Array.isArray(body.coursesId)
		|| body.coursesId.some(id => !Number.isSafeInteger(id) || id <= 0)) {
		return { error: { code: 400, message: 'Invalid course selection' } }
	}
	const uniqueCourseIds = [ ...new Set(body.coursesId) ]
	const subscription = await prisma.subscription.findFirst({
		where: { userId, canceled: false },
		include: { license: true },
	})
	if (!subscription) return { error: { code: 412, message: 'Нет активных подписок' } }
	const excludedIds = subscription.license.courses
		? JSON.parse(subscription.license.courses) as number[]
		: []
	const availableCourses = await prisma.course.count({
		where: {
			id: { in: uniqueCourseIds, notIn: excludedIds },
			deleted: false,
			visible: true,
		},
	})
	if (availableCourses !== uniqueCourseIds.length) {
		return { error: { code: 400, message: 'Недоступный курс' } }
	}
	const data = await prisma.subscription.update({
		where: { id: subscription.id },
		data: {
			courses: JSON.stringify(uniqueCourseIds.slice(0,
				subscription.license.freeCourses)),
		},
	})
	return { response: data }
}))
export default handler
