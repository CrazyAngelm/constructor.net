import { Prisma } from '@prisma/client'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { getStudioCatalogAccess } from '@/lib/studio/access'
import { accessibleLegacyPrograms, publishedProgramFilter } from '@/lib/studio/programs'
import { convertLegacyProgram } from '@/lib/studio/legacyProgram'
import { copyProgramImages } from '@/lib/studio/copyImages'

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.post(responseAuth(async (req, _res, userId) => {
	const access = await getStudioCatalogAccess(prisma, userId)
	if (!access) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const id = typeof req.query.id === 'string' ? req.query.id : ''
	if (!id) return { error: { code: 400, message: 'Некорректный идентификатор' } }
	let source
	if (id.startsWith('legacy:')) {
		const legacyId = id.slice('legacy:'.length)
		const permitted = (await accessibleLegacyPrograms(prisma, access)).get(legacyId)
		const legacy = permitted && await prisma.worklist.findUnique({ where: { id: legacyId } })
		if (!legacy?.json) return { error: { code: 404, message: 'Программа не найдена или недоступна в вашей подписке' } }
		const sheets = convertLegacyProgram(legacy.json)
		source = { ownerId: userId, name: legacy.name || 'Конспект', teacherSheet: JSON.stringify(sheets.teacherSheet), studentSheet: JSON.stringify(sheets.studentSheet), courseId: permitted!.courseId, folderId: null, personalFolderId: null }
	} else {
		source = await prisma.studioWorklist.findFirst({ where: { id, OR: [{ ownerId: userId }, publishedProgramFilter(access)] } })
	}
	if (!source) return { error: { code: 404, message: 'Конспект не найден' } }
	const own = source.ownerId === userId
	const copiedImages = own ? null : await copyProgramImages([source.teacherSheet, source.studentSheet], source.ownerId, userId)
	try {
	const copy = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
		const last = await tx.studioWorklist.findFirst({ where: { ownerId: userId }, orderBy: { position: 'desc' }, select: { position: true } })
		const prefix = 'Копия: '
		return tx.studioWorklist.create({ data: {
			ownerId: userId,
			name: `${prefix}${source.name.slice(0, 191 - prefix.length)}`,
			teacherSheet: copiedImages?.sheets[0] ?? source.teacherSheet,
			studentSheet: copiedImages?.sheets[1] ?? source.studentSheet,
			courseId: source.courseId,
			folderId: own ? source.folderId : null,
			personalFolderId: own ? source.personalFolderId : null,
			position: (last?.position ?? -1) + 1,
		} })
	})
	return { response: {
		...copy,
		teacherSheet: JSON.parse(copy.teacherSheet),
		studentSheet: JSON.parse(copy.studentSheet),
	} }
	} catch (error) { await copiedImages?.cleanup(); throw error }
}))

export default handler
