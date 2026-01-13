import { PrismaClient } from "@prisma/client";
import { TaskCategoryDto } from "@/lib/dto/tasks";
import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response, responseAuth } from "@/lib/api/response";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { usePrisma } from "@/lib/api/database";
import { FolderDto } from "@/lib/dto/worklist";
import { ScopeEnum } from "@/lib/dto/users";
const prisma = usePrisma()
const handler = getDefaultHandler()
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.get(response(async (req, res) => {
	const id = (req.query as Query).id as string
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const data = await prisma.folder.findUnique({
		where: { id }
	}) as FolderDto
	if (!data) return { error: { code: 400, message: 'Записи не существует' } }
	return { response: data }
})
)
handler.post(response(async (req, res) => {
	const id = (req.query as Query).id as string
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const data = req.body as FolderDto
	const upset = await prisma.folder.update({
		where: { id },
		data: {
			name: data.name,
			date: new Date().toISOString(),
			deleted: false
		}
	})
	return { response: upset as FolderDto }
}))
handler.delete(response(async (req, res) => {
	const id = (req.query as Query).id as string
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	await prisma.folder.update({
		where: { id },
		data: {
			deleted: true
		}
	})
	return { response: true }
}))
export default handler
