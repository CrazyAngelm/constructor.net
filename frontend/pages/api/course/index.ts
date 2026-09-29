import { PrismaClient } from '@prisma/client'
import { CourseDto } from '@/lib/dto/tasks'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response, getAuthenticatedApiUser } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.get(response(async (req) => {
	const user = await getAuthenticatedApiUser(req)
	const data = await prisma.course.findMany({
		where: { deleted: false, ...(user?.scopes.includes('admin') ? {} : { visible: true }) },
		include: {
			CourseToCategory: {
				select: {
					categoryId: true,
				},
			},
		},
	})
	const resp: CourseDto[] = data.map((p) => {
		return {
			...p,
			categories: p.CourseToCategory.map(p => p.categoryId),
		}
	})
	return { response: resp }
}))
export default handler
