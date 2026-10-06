import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAdmin } from '@/lib/api/response'
import { parseVisibility } from '@/lib/studio/validation'

interface Query extends NextParsedUrlQuery { id?: string }

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.patch(responseAdmin(async (req) => {
	const id = (req.query as Query).id
	if (typeof id !== 'string' || id.length === 0) return { error: { code: 400, message: 'Некорректный идентификатор папки' } }
	const parsed = parseVisibility(req.body)
	if ('error' in parsed) return { error: { code: 400, message: parsed.error } }
	const updated = await prisma.folder.updateMany({ where: { id }, data: { visible: parsed.value } })
	if (updated.count === 0) return { error: { code: 404, message: 'Папка не найдена' } }
	return { response: { id, visible: parsed.value } }
}))

export default handler
