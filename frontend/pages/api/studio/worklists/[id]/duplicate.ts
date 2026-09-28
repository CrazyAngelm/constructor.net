import { Prisma } from '@prisma/client'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { getStudioCatalogAccess } from '@/lib/studio/access'

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.post(responseAuth(async (req, _res, userId) => {
	if (!await getStudioCatalogAccess(prisma, userId)) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const id = typeof req.query.id === 'string' ? req.query.id : ''
	if (!id) return { error: { code: 400, message: 'Некорректный идентификатор' } }
	const copy = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
		const source = await tx.studioWorklist.findFirst({ where: { id, ownerId: userId } })
		if (!source) return null
		const last = await tx.studioWorklist.findFirst({ where: { ownerId: userId }, orderBy: { position: 'desc' }, select: { position: true } })
		const prefix = 'Копия: '
		return tx.studioWorklist.create({ data: {
			ownerId: userId,
			name: `${prefix}${source.name.slice(0, 191 - prefix.length)}`,
			teacherSheet: source.teacherSheet,
			studentSheet: source.studentSheet,
			courseId: source.courseId,
			folderId: source.folderId,
			personalFolderId: source.personalFolderId,
			position: (last?.position ?? -1) + 1,
		} })
	})
	if (!copy) return { error: { code: 404, message: 'Конспект не найден' } }
	return { response: {
		...copy,
		teacherSheet: JSON.parse(copy.teacherSheet),
		studentSheet: JSON.parse(copy.studentSheet),
	} }
}))

export default handler
