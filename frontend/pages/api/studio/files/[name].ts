import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { NextParsedUrlQuery } from 'next/dist/server/request-meta'

import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { getAuthenticatedApiUser } from '@/lib/api/response'
import { getStudioCatalogAccess } from '@/lib/studio/access'
import { getStudioUploadRoot, isStudioFileName, studioOwnerDirectory } from '@/lib/studio/uploads'

interface Query extends NextParsedUrlQuery { name?: string }

const handler = getDefaultHandler()
const prisma = getPrisma()

handler.get(async (req, res) => {
	const user = await getAuthenticatedApiUser(req)
	if (!user) return res.status(401).end('Неверные данные авторизации')
	if (!await getStudioCatalogAccess(prisma, user.id)) return res.status(403).end('Требуется активная подписка')
	const name = (req.query as Query).name
	if (!isStudioFileName(name)) return res.status(404).end('Файл не найден')
	try {
		const file = await readFile(path.join(getStudioUploadRoot(), studioOwnerDirectory(user.id), name))
		res.setHeader('Content-Type', name.endsWith('.png') ? 'image/png' : 'image/jpeg')
		res.setHeader('X-Content-Type-Options', 'nosniff')
		res.setHeader('Cache-Control', 'private, max-age=3600')
		return res.status(200).send(file)
	} catch {
		return res.status(404).end('Файл не найден')
	}
})

export default handler
