import { PrismaClient } from '@prisma/client'
import { TaskCategoryDto } from '@/lib/dto/tasks'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response, responseAdmin } from '@/lib/api/response'
import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { getPrisma } from '@/lib/api/database'
const prisma = getPrisma()
const handler = getDefaultHandler()
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.get(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const data = await prisma.taskCategory.findUnique({
		where: { id },
		include: {
			CategoryToTask: {
				where: { task: { deleted: false } },
			},
		},
	}) as TaskCategoryDto
	if (!data) return { error: { code: 400, message: 'Записи не существует' } }
	return { response: data }
}))
handler.post(responseAdmin(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const data = req.body as TaskCategoryDto
	const upset = await prisma.taskCategory.upsert({
		where: { id },
		update: {
			name: data.name,
			description: data.description,
			date: new Date().toISOString(),
		},
		create: {
			name: data.name ? data.name : 'Без названия',
			description: data.description ? data.description : '',
			date: new Date().toISOString(),
		},
	})
	return { response: upset as TaskCategoryDto }
}))
handler.put(responseAdmin(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	await prisma.taskCategory.delete({
		where: { id },
	})
	return { response: { status: 'Ok' } }
}))
export default handler
