import { PrismaClient } from "@prisma/client";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { TaskDto } from "@/lib/dto/tasks";


const prisma = new PrismaClient()
const handler = getDefaultHandler()

interface Query extends NextParsedUrlQuery {
	id?: string
}

handler.get(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, msg: 'Неверный индекс' } }
	const task = await prisma.task.findUnique({
		where: { id }
	})

	if (!task) return { error: { code: 400, msg: 'Записи не существует' } }

	return { response: task }
})
)

handler.post(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, msg: 'Неверный индекс' } }

	const data = req.body as TaskDto

	console.log(id,data)

	const upset = await prisma.task.upsert({
		where: { id },
		update: {
			name:data.name,
			description:data.description,
			taskCategoryId:data.taskCategoryId
		},
		create: {
			name: data.name ? data.name : 'Без названия',
			description: data.description ? data.description : '',
			image: '',
			taskCategoryId: data.taskCategoryId ? data.taskCategoryId : -1
		}
	})

	return { response: { upset } }
}))

export default handler
