import { PrismaClient } from '@prisma/client'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { TaskCategoryDto, TaskDto } from '@/lib/dto/tasks'
import { getPrisma } from '@/lib/api/database'
const prisma = getPrisma()
const handler = getDefaultHandler()
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.get(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const task = await prisma.task.findUnique({
		where: { id },
		include: {
			CategoryToTask: {
				include: {
					category: true,
				},
			},
		},
	})
	if (!task) return { error: { code: 400, message: 'Записи не существует' } }
	const dto = task as TaskDto
	dto.categories = task?.CategoryToTask.map(p => p.category.id)
	return { response: dto }
}))
handler.post(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const data = req.body as TaskDto
	const upset = await prisma.task.upsert({
		where: { id },
		update: {
			name: data.name,
			description: data.description,
			instruction: data.instruction,
			date: new Date().toISOString(),
			complexity: data.complexity,
		},
		create: {
			name: data.name ? data.name : 'Новое задание',
			description: data.description ? data.description : '',
			instruction: data.instruction ? data.instruction : '',
			image: '',
			complexity: data.complexity,
			date: new Date().toISOString(),
		},
	})
	if (data.categories) {
		await prisma.categoryToTask.deleteMany({
			where: {
				taskId: upset.id,
			},
		})
		const a = await prisma.categoryToTask.createMany({
			data: data.categories.map((p) => {
				return { taskId: upset.id, categoryId: p }
			}),
		})
	}
	return { response: upset as TaskDto }
}))
handler.put(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	await prisma.task.update({
		where: { id },
		data: { deleted: true },
	})
	return { response: { status: 'Ok' } }
}))
export default handler
