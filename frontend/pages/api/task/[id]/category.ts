import { PrismaClient } from '@prisma/client'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { RequestIds, TaskCategoryDto, TaskDto } from '@/lib/dto/tasks'
import { getPrisma } from '@/lib/api/database'
const prisma = getPrisma()
const handler = getDefaultHandler()
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.get(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Invalid index' } }
	const data = await prisma.task.findUnique({
		where: { id },
		include: { TaskCategory: true },
	})
	if (!data) return { error: { code: 400, message: 'The item does not exist' } }
	return { response: data.TaskCategory }
}))
handler.post(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Invalid index' } }
	const data = req.body as RequestIds
	await prisma.categoryToTask.deleteMany({
		where: {
			taskId: id,
		},
	})
	await data.id.map(async (p) => {
		const upset = await prisma.categoryToTask.upsert({
			where: {
				taskId_categoryId: {
					taskId: id,
					categoryId: p,
				},
			},
			update: {},
			create: {
				taskId: id,
				categoryId: p,
			},
		})
	})
	return { response: { status: 'Ok' } }
}))
export default handler
