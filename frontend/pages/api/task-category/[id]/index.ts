import { PrismaClient } from "@prisma/client";

import { TaskCategoryDto } from "@/lib/dto/tasks";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
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
	const data = await prisma.taskCategory.findUnique({
		where: { id },
		include: {
			CategoryToTask: {
				where: { task: { deleted: false } },
			}
		}
	}) as TaskCategoryDto
	if (!data) return { error: { code: 400, message: 'Записи не существует' } }

	return { response: data }
})
)

handler.post(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }

	const data = req.body as TaskCategoryDto

	const upset = await prisma.taskCategory.upsert({
		where: { id },
		update: {
			name: data.name,
			description: data.description,
			date: new Date().toISOString()
		},
		create: {
			name: data.name ? data.name : 'Без названия',
			description: data.description ? data.description : '',
			date: new Date().toISOString()
		}
	})

	/* if (data.courses) {
		await prisma.courseToCategory.deleteMany({
			where: {
				categoryId: upset.id
			}
		})
		const a = await prisma.courseToCategory.createMany({
			data: data.courses.map(p => {
				return { categoryId: upset.id, courseId: p }
			})
		})
		console.log(a)
	} */

	return { response: upset as TaskCategoryDto }
}))

handler.put(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }

	await prisma.taskCategory.delete({
		where: { id }
	})

	return { response: { status: 'Ok' } }

}))

export default handler
