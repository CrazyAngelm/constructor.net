import { Prisma } from '@prisma/client'
import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { parseUpdateStudioWorklist } from '@/lib/studio/validation'
import { getStudioCatalogAccess } from '@/lib/studio/access'
import { sheetFooter } from '@/lib/studio/footer'

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
	const worklist = await prisma.studioWorklist.findFirst({ where: { id, ownerId: userId } })
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
	const ownerFilter = { id, ownerId: userId }
	const current = await prisma.studioWorklist.findFirst({ where: ownerFilter, select: { id: true, teacherSheet: true, studentSheet: true } })
	if (!current) return { error: { code: 404, message: 'Ворклист не найден' } }
	if (([ 'teacherSheet', 'studentSheet' ] as const).some(key => parsed.value[key] && parsed.value[key]!.version < JSON.parse(current[key]).version)) return { error: { code: 409, message: 'Конспект сохранён в новой версии редактора. Обновите страницу перед изменением.' } }
	if (!access.canEditFooter && ([ 'teacherSheet', 'studentSheet' ] as const).some(key => parsed.value[key] && sheetFooter(parsed.value[key]) !== sheetFooter(JSON.parse(current[key])))) return { error: { code: 403, message: 'Ваша лицензия не разрешает изменять подпись внизу листа' } }
	const data: Prisma.StudioWorklistUncheckedUpdateInput = {
		...(parsed.value.name === undefined ? {} : { name: parsed.value.name }),
		...(parsed.value.teacherSheet === undefined ? {} : { teacherSheet: JSON.stringify(parsed.value.teacherSheet) }),
		...(parsed.value.studentSheet === undefined ? {} : { studentSheet: JSON.stringify(parsed.value.studentSheet) }),
		...(parsed.value.courseId === undefined ? {} : { courseId: parsed.value.courseId }),
		...(parsed.value.folderId === undefined ? {} : { folderId: parsed.value.folderId }),
		...(parsed.value.personalFolderId === undefined ? {} : { personalFolderId: parsed.value.personalFolderId }),
	}
	const worklist = await prisma.$transaction(async (tx) => {
		if (parsed.value.personalFolderId && !await tx.studioFolder.findFirst({ where: { id: parsed.value.personalFolderId, ownerId: userId } })) return 'folder-missing' as const
		// Guard the read/check/write seam too: a concurrent newer save must not be downgraded.
		const updated = await tx.studioWorklist.updateMany({ where: { ...ownerFilter, teacherSheet: current.teacherSheet, studentSheet: current.studentSheet }, data })
		if (!updated.count) return 'changed' as const
		return tx.studioWorklist.findUnique({ where: { id: current.id } })
	})
	if (worklist === 'folder-missing') return { error: { code: 404, message: 'Личная папка не найдена' } }
	if (worklist === 'changed') return { error: { code: 409, message: 'Конспект изменился в другом окне. Обновите страницу перед сохранением.' } }
	if (!worklist) return { error: { code: 404, message: 'Конспект не найден' } }
	return { response: serialize(worklist) }
}))

handler.delete(responseAuth(async (req, _res, userId) => {
	const access = await getStudioCatalogAccess(prisma, userId)
	if (!access) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const id = getId(req.query as Query)
	if (!id) return { error: { code: 400, message: 'Некорректный идентификатор' } }
	const deleted = await prisma.studioWorklist.deleteMany({ where: { id, ownerId: userId } })
	if (deleted.count === 0) return { error: { code: 404, message: 'Ворклист не найден' } }
	return { response: { deleted: true } }
}))

export default handler
