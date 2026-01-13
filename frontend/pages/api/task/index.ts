import { PrismaClient } from '@prisma/client'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.get(response(async () => {
	const tasks = await prisma.task.findMany({ where: { deleted: false } })
	return { response: tasks }
}))
export default handler
