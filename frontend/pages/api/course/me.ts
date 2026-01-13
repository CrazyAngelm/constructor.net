import { getDefaultHandler } from "@/lib/api/apiHandler";
import { responseAuth } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { Subscription } from "@/lib/dto/subscription";
import { ScopeEnum } from "@/lib/dto/users";
const prisma = usePrisma()
const handler = getDefaultHandler()
handler.get(responseAuth(async (req, res, userId) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { scopes: { include: { scope: true } } }
	})
	if (user?.scopes.find(p => p.scope.value == ScopeEnum.admin)) {
		const data = await prisma.course.findMany({
			where: {
				deleted: false,
			}
		})
		return { response: data }
	}
	const subscription = await prisma.subscription.findFirst({
		where: { userId: userId, canceled: false, active: true },
		include: { license: true }
	})
	if (!subscription) return { error: { code: 412, message: 'У пользователя отсутвует активная подписка' } }
	const licenseCourses = subscription.license.courses ?
		JSON.parse(subscription.license.courses) as number[] : []
	const freeCourses = subscription.courses ?
		JSON.parse(subscription.courses) as number[] : []
	const courses = [ ...freeCourses, ...licenseCourses ]
	const data = await prisma.course.findMany({
		where: {
			deleted: false,
			id: { in: courses }
		}
	})
	return { response: data }
}))
export default handler
