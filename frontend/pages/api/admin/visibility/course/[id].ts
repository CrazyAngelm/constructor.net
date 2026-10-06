import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAdmin } from '@/lib/api/response'
import { parseVisibility } from '@/lib/studio/validation'
import { synchronizeUnlimitedCourses } from '@/lib/subscription/legacyEntitlements'

interface Query extends NextParsedUrlQuery { id?: string }

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.patch(responseAdmin(async (req) => {
	const rawId = (req.query as Query).id
	const id = typeof rawId === 'string' ? Number(rawId) : Number.NaN
	if (!Number.isSafeInteger(id) || id < 1) return { error: { code: 400, message: 'Некорректный идентификатор курса' } }
	const parsed = parseVisibility(req.body)
	if ('error' in parsed) return { error: { code: 400, message: parsed.error } }
	const updated = await prisma.$transaction(async tx => {
		const result = await tx.course.updateMany({ where: { id, deleted: false }, data: { visible: parsed.value } })
		if (result.count) await synchronizeUnlimitedCourses(tx)
		return result
	})
	if (updated.count === 0) return { error: { code: 404, message: 'Курс не найден' } }
	return { response: { id, visible: parsed.value } }
}))

export default handler
