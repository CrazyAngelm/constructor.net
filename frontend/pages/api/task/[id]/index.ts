import { PrismaClient } from "@prisma/client";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { TaskCategoryDto, TaskDto } from "@/lib/dto/tasks";
import { usePrisma } from "@/lib/api/database";


const prisma = usePrisma()
const handler = getDefaultHandler()

interface Query extends NextParsedUrlQuery {
	id?: string
}

handler.get(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, msg: 'Неверный индекс' } }
	const task = await prisma.task.findUnique({
		where: { id },
		include: {
			CategoryToTask: {
				include: {
					category: true
				}
			}
		}
	})

	if (!task) return { error: { code: 400, msg: 'Записи не существует' } }

	const dto = task as TaskDto
	dto.categpries = task?.CategoryToTask.map(p => p.category.id)

	return { response: dto }
})
)

handler.post(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, msg: 'Неверный индекс' } }

	const data = req.body as TaskDto

	const upset = await prisma.task.upsert({
		where: { id },
		update: {
			name: data.name,
			description: data.description,
			instruction: data.instruction,
			date: new Date().toISOString()
		},
		create: {
			name: data.name ? data.name : 'Без названия',
			description: data.description ? data.description : '',
			instruction: data.instruction ? data.instruction : '',
			image: '',
			date: new Date().toISOString()
		}
	})
	if (data.categpries) {
		await prisma.categoryToTask.deleteMany({
			where: {
				taskId: upset.id
			}
		})
		const a = await prisma.categoryToTask.createMany({
			data: data.categpries.map(p => {
				return { taskId: upset.id, categoryId: p }
			})
		})
	}

	return { response: upset as TaskDto }
}))


handler.put(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, msg: 'Неверный индекс' } }

	await prisma.task.delete({
		where: { id }
	})

	return { response: { status: 'Ok' } }

}))

export default handler
