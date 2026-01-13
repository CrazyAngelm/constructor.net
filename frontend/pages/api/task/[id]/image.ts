import { PrismaClient } from '@prisma/client'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { TaskCategoryDto, TaskDto } from '@/lib/dto/tasks'
import multer from 'multer'
import { v4 } from 'uuid'
import { usePrisma } from '@/lib/api/database'
const prisma = usePrisma()
const handler = getDefaultHandler()
let fileName = ''
const upload = multer({
	storage: multer.diskStorage({
		destination: process.env.UPLOAD_IMAGE_TASK,
		filename: (req, file, cb) => {
			fileName = v4()+file.originalname
			cb(null, fileName)
		},
	}),
})
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.use(upload.array('file'))
handler.post(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	await prisma.task.update({
		where: { id },
		data: {
			image: `${process.env.DOWNLOAD_IMAGE_TASK}/${fileName}`,
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
