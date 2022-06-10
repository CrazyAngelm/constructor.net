import { PrismaClient } from "@prisma/client";

import { TaskCategoryDto } from "@/lib/dto/tasks";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";


const prisma = new PrismaClient()
const handler = getDefaultHandler()

interface Query extends NextParsedUrlQuery {
	id?: string
}

handler.get(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, msg: 'Неверный индекс' } }
	const category = await prisma.taskCategory.findUnique({
		where: { id },
		include: {
			tasks: {
				select: { id: true }
			}
		}
	})
	if (!category) return { error: { code: 400, msg: 'Записи не существует' } }
	const { tasks, ...props } = category
	const dto = props as TaskCategoryDto
	dto.tasksId = tasks.map(t => t.id)

	return { response: dto }
})
)

handler.post(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, msg: 'Неверный индекс' } }

	const data = req.body as TaskCategoryDto

	const upset = await prisma.taskCategory.upsert({
		where: { id },
		update: {
			name: data.name,
			description: data.description
		},
		create: {
			name: data.name ? data.name : 'Без названия',
			description: data.description ? data.description : ''
		}
	})

	console.log(upset)

	return { response: upset as TaskCategoryDto }
}))

handler.put(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, msg: 'Неверный индекс' } }

	await prisma.taskCategory.delete({
		where: { id }
	})

	return { response: { status: 'Ok' } }

}))

export default handler
