import { Course, PrismaClient } from "@prisma/client";

import { CourseDto } from "@/lib/dto/tasks";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response, responseAdmin } from "@/lib/api/response";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { usePrisma } from "@/lib/api/database";


const prisma = usePrisma()
const handler = getDefaultHandler()

interface Query extends NextParsedUrlQuery {
	id?: string
}

handler.get(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const data = await prisma.course.findUnique({
		where: { id }
	}) as CourseDto
	if (!data) return { error: { code: 400, message: 'Записи не существует' } }


	return { response: data }
})
)

handler.post(responseAdmin(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }

	const data = req.body as CourseDto

	const upset = await prisma.course.upsert({
		where: { id },
		update: {
			name: data.name,
			description: data.description,
			date: new Date().toISOString()
		},
		create: {
			name: data.name ? data.name : 'Новый курс',
			description: data.description ? data.description : '',
			date: new Date().toISOString()
		}
	})

	return { response: upset as CourseDto }
}))

handler.put(responseAdmin(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }

	await prisma.course.update({
		where: { id },
		data: { deleted: true }
	})

	return { response: { status: 'Ok' } }

}))

export default handler
