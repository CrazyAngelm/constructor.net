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

	return { response: task }
})
)

handler.post(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, msg: 'Неверный индекс' } }

	const data = req.body as TaskDto

	const upset = await prisma.task.upsert({
		where: { id },
		update: {},
		create: {
			id,
			name: data.name ? data.name : 'Без названия',
			description: data.description ? data.description : '',
			image: data.image ? data.image : '',
			taskCategoryId: data.taskCategoryId ? data.taskCategoryId : -1
		}
	})

	console.log(upset)

	return { response: { upset } }
}))

export default handler
