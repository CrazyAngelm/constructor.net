import { Prisma } from '@prisma/client'
import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { parseUpdateStudioWorklist } from '@/lib/studio/validation'
import { getStudioCatalogAccess } from '@/lib/studio/access'

interface Query extends NextParsedUrlQuery { id?: string }

const prisma = getPrisma()
const handler = getDefaultHandler()

const getId = (query: Query): string | null => typeof query.id === 'string' && query.id.length > 0 ? query.id : null
const serialize = (worklist: { teacherSheet: string, studentSheet: string }) => ({
	...worklist,
	teacherSheet: JSON.parse(worklist.teacherSheet),
	studentSheet: JSON.parse(worklist.studentSheet),
})

handler.get(responseAuth(async (req, _res, userId) => {
	const access = await getStudioCatalogAccess(prisma, userId)
	if (!access) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const id = getId(req.query as Query)
	if (!id) return { error: { code: 400, message: 'Некорректный идентификатор' } }
	const worklist = await prisma.studioWorklist.findFirst({ where: access.isAdmin ? { id } : { id, ownerId: userId } })
	if (!worklist) return { error: { code: 404, message: 'Ворклист не найден' } }
	return { response: serialize(worklist) }
}))

handler.put(responseAuth(async (req, _res, userId) => {
	const access = await getStudioCatalogAccess(prisma, userId)
	if (!access) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const id = getId(req.query as Query)
	if (!id) return { error: { code: 400, message: 'Некорректный идентификатор' } }
	const parsed = parseUpdateStudioWorklist(req.body)
	if ('error' in parsed) return { error: { code: 400, message: parsed.error } }
	const ownerFilter = access.isAdmin ? { id } : { id, ownerId: userId }
	const current = await prisma.studioWorklist.findFirst({ where: ownerFilter, select: { id: true } })
	if (!current) return { error: { code: 404, message: 'Ворклист не найден' } }
	const data: Prisma.StudioWorklistUncheckedUpdateInput = {
		...(parsed.value.name === undefined ? {} : { name: parsed.value.name }),
		...(parsed.value.teacherSheet === undefined ? {} : { teacherSheet: JSON.stringify(parsed.value.teacherSheet) }),
		...(parsed.value.studentSheet === undefined ? {} : { studentSheet: JSON.stringify(parsed.value.studentSheet) }),
		...(parsed.value.courseId === undefined ? {} : { courseId: parsed.value.courseId }),
		...(parsed.value.folderId === undefined ? {} : { folderId: parsed.value.folderId }),
	}
	const worklist = await prisma.studioWorklist.update({ where: { id: current.id }, data })
	return { response: serialize(worklist) }
}))

handler.delete(responseAuth(async (req, _res, userId) => {
	const access = await getStudioCatalogAccess(prisma, userId)
	if (!access) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const id = getId(req.query as Query)
	if (!id) return { error: { code: 400, message: 'Некорректный идентификатор' } }
	const deleted = await prisma.studioWorklist.deleteMany({ where: access.isAdmin ? { id } : { id, ownerId: userId } })
	if (deleted.count === 0) return { error: { code: 404, message: 'Ворклист не найден' } }
	return { response: { deleted: true } }
}))

export default handler
