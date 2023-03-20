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
	const id = (req.query as Query).id
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const data = await prisma.worklist.findUnique({
		where: { id }
	})
	if (!data) return { error: { code: 400, message: 'Записи не существует' } }

	return { response: data }
})
)


handler.delete(response(async (req, res) => {
	const id = (req.query as Query).id
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }

	await prisma.worklist.delete({
		where: { id }
	})

	return { response: true }

}))

export default handler
