import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { getPrisma } from '@/lib/api/database'
import { Manual } from '@/lib/dto/manuals'
const prisma = getPrisma()
const handler = getDefaultHandler()
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.get(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const data = await prisma.manual.findUnique({
		where: { id: id },
	}) as Manual
	if (!data) return { error: { code: 400, message: 'Записи не существует' } }
	return { response: data }
}))
handler.post(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const data = req.body as Manual
	const upset = await prisma.manual.update({
		where: { id },
		data: {
			name: data.name,
			html: data.html,
			date: new Date().toISOString(),
		},
	})
	return { response: upset as Manual }
}))
handler.put(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	await prisma.manual.update({
		where: { id },
		data: { deleted: true },
	})
	return { response: { status: 'Ok' } }
}))
export default handler
