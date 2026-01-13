import { PrismaClient } from "@prisma/client";
import { TaskCategoryDto } from "@/lib/dto/tasks";
import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response, responseAuth } from "@/lib/api/response";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { usePrisma } from "@/lib/api/database";
import { ScopeEnum } from "@/lib/dto/users";
import { WorklistDto } from "@/lib/dto/worklist";
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
handler.post(responseAuth(async (req, res, userId) => {
	const id = (req.query as Query).id
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { scopes: { include: { scope: true } } }
	})
	if (user?.scopes.find(p => p.scope.value == ScopeEnum.admin)) {
		const data = req.body as WorklistDto
		const upset = await prisma.worklist.upsert({
			where: { id },
			update: {
				name: data.name,
				json: data.json,
				date: new Date().toISOString()
			},
			create: {
				name: data.name ? data.name : 'Безымянный',
				json: data.json,
				date: new Date().toISOString()
			}
		})
		return { response: true }
	} else {
		return { error: { code: 403, message: "Данное действие доступно только администраторам" } }
	}
}))
handler.delete(responseAuth(async (req, res, userId) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { scopes: { include: { scope: true } } }
	})
	if (user?.scopes.find(p => p.scope.value == ScopeEnum.admin)) {
		const id = (req.query as Query).id
		if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
		await prisma.folderToWorklist.deleteMany({
			where: {
				worklistId: id
			}
		})
		await prisma.courseToWorklist.deleteMany({
			where: {
				worklistId: id
			}
		})
		await prisma.worklist.delete({
			where: { id }
		})
		return { response: true }
	} else {
		return { error: { code: 403, message: "Данное действие доступно только администраторам" } }
	}
}))
export default handler
