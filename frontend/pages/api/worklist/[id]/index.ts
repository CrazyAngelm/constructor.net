import { PrismaClient } from '@prisma/client'
import { TaskCategoryDto } from '@/lib/dto/tasks'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response, responseAdmin } from '@/lib/api/response'
import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { getPrisma } from '@/lib/api/database'
import { WorklistDto } from '@/lib/dto/worklist'
const prisma = getPrisma()
const handler = getDefaultHandler()
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.get(response(async (req, res) => {
	const id = (req.query as Query).id
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const data = await prisma.worklist.findUnique({
		where: { id },
	})
	if (!data) return { error: { code: 400, message: 'Записи не существует' } }
	return { response: data }
}))
handler.post(responseAdmin(async (req, res) => {
	const id = (req.query as Query).id
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const data = req.body as WorklistDto
	await prisma.worklist.upsert({
		where: { id },
		update: {
			name: data.name,
			json: data.json,
			date: new Date().toISOString(),
		},
		create: {
			name: data.name ? data.name : 'Безымянный',
			json: data.json,
			date: new Date().toISOString(),
		},
	})
	return { response: true }
}))
handler.delete(responseAdmin(async (req, res) => {
	const id = (req.query as Query).id
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	await prisma.folderToWorklist.deleteMany({
		where: {
			worklistId: id,
		},
	})
	await prisma.courseToWorklist.deleteMany({
		where: {
			worklistId: id,
		},
	})
	await prisma.worklist.delete({
		where: { id },
	})
	return { response: true }
}))
export default handler

