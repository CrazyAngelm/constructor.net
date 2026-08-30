import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAdmin } from '@/lib/api/response'
import { parseVisibility } from '@/lib/studio/validation'

interface Query extends NextParsedUrlQuery { id?: string }

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.patch(responseAdmin(async (req) => {
	const rawId = (req.query as Query).id
	const id = typeof rawId === 'string' ? Number(rawId) : Number.NaN
	if (!Number.isSafeInteger(id) || id < 1) return { error: { code: 400, message: 'Некорректный идентификатор курса' } }
	const parsed = parseVisibility(req.body)
	if ('error' in parsed) return { error: { code: 400, message: parsed.error } }
	const updated = await prisma.course.updateMany({ where: { id }, data: { visible: parsed.value } })
	if (updated.count === 0) return { error: { code: 404, message: 'Курс не найден' } }
	return { response: { id, visible: parsed.value } }
}))

export default handler
