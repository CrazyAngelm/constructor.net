import { PrismaClient } from '@prisma/client'
import { TaskCategoryDto } from '@/lib/dto/tasks'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.get(response(async () => {
	const data = await prisma.taskCategory.findMany({
		where: { deleted: false },
		include: {
			CategoryChildren: true,
		},
	})
	return { response: data }
}))
export default handler
