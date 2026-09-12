import { PrismaClient } from '@prisma/client'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { responseAdmin } from '@/lib/api/response'
import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { TaskCategoryDto, TaskDto } from '@/lib/dto/tasks'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { getPrisma } from '@/lib/api/database'
const prisma = getPrisma()
const handler = getDefaultHandler()
const upload = multer({
	storage: multer.diskStorage({
		destination: process.env.UPLOAD_IMAGE_TASK,
		filename: (req, file, cb) => {
			cb(null, randomUUID()+file.originalname)
		},
	}),
})
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.post(responseAdmin(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	await new Promise<void>((resolveUpload, rejectUpload) => {
		upload.array('file')(req as never, res as never, (error) => error ? rejectUpload(error) : resolveUpload())
	})
	const uploaded = (req as unknown as { files?: Array<{ filename: string }> }).files?.[0]
	if (!uploaded) return { error: { code: 400, message: 'Файл не загружен' } }
	await prisma.task.update({
		where: { id },
		data: {
			image: `${process.env.DOWNLOAD_IMAGE_TASK}/${uploaded.filename}`,
		},
	})
	return { response: { status: 'Ok' } }
}))
export const config = {
	api: {
		bodyParser: false, // Disallow body parsing, consume as stream
	},
}
export default handler
