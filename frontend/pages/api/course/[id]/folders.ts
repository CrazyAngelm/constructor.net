import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { PrismaClient } from '@prisma/client'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
import { TaskCategoryDto } from '@/lib/dto/tasks'
import { FolderDto } from '@/lib/dto/worklist'
const prisma = getPrisma()
const handler = getDefaultHandler()
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.get(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const data = await prisma.course.findUnique({
		where: { id },
		include: {
			FolderToCourse: {
				where: {
					folder: {
						deleted: false,
					},
				},
				include: {
					folder: true,
				},
			},
		},
	})
	if (data === null) return { error: { code: 402, message: 'Неверный запрос' } }
	const resp: FolderDto[] = data.FolderToCourse.map((p) => {
		return { ...p.folder }
	})
	return { response: resp }
}))
export default handler

