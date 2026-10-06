import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import multer from 'multer'

import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { getStudioCatalogAccess } from '@/lib/studio/access'
import {
	getStudioUploadRoot,
	sniffStudioImage,
	STUDIO_UPLOAD_MAX_BYTES,
	studioOwnerDirectory,
} from '@/lib/studio/uploads'

const handler = getDefaultHandler()
const prisma = getPrisma()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: STUDIO_UPLOAD_MAX_BYTES, files: 1 } })

handler.post(responseAuth(async (req, res, userId) => {
	if (!await getStudioCatalogAccess(prisma, userId)) return { error: { code: 403, message: 'Требуется активная подписка' } }
	try {
		await new Promise<void>((resolve, reject) => {
			upload.single('file')(req as never, res as never, error => error ? reject(error) : resolve())
		})
	} catch (error) {
		if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
			return { error: { code: 413, message: 'Файл больше допустимого размера 5 МБ' } }
		}
		return { error: { code: 400, message: 'Не удалось принять файл' } }
	}
	const file = (req as typeof req & { file?: Express.Multer.File }).file
	if (!file) return { error: { code: 400, message: 'Выберите изображение' } }
	const image = sniffStudioImage(file.buffer)
	if (!image) return { error: { code: 415, message: 'Поддерживаются изображения PNG и JPEG' } }
	const fileName = `${randomUUID()}.${image.extension}`
	const directory = path.join(getStudioUploadRoot(), studioOwnerDirectory(userId))
	await mkdir(directory, { recursive: true })
	await writeFile(path.join(directory, fileName), file.buffer, { flag: 'wx' })
	return { response: { url: `/api/studio/files/${fileName}`, contentType: image.contentType } }
}))

export const config = { api: { bodyParser: false } }
export default handler
