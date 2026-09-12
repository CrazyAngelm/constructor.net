import { Prisma } from '@prisma/client'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { parseCreateStudioWorklist } from '@/lib/studio/validation'
import { getStudioCatalogAccess } from '@/lib/studio/access'
import { sheetFooter } from '@/lib/studio/footer'

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.get(responseAuth(async (_req, _res, userId) => {
	if (!await getStudioCatalogAccess(prisma, userId)) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const worklists = await prisma.studioWorklist.findMany({
		where: { ownerId: userId },
		orderBy: [{ position: 'asc' }, { id: 'asc' }],
	})
	return { response: { worklists: worklists.map((worklist) => ({
		...worklist,
		teacherSheet: JSON.parse(worklist.teacherSheet),
		studentSheet: JSON.parse(worklist.studentSheet),
	})) } }
}))

handler.post(responseAuth(async (req, _res, userId) => {
	const access = await getStudioCatalogAccess(prisma, userId)
	if (!access) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const parsed = parseCreateStudioWorklist(req.body)
	if ('error' in parsed) return { error: { code: 400, message: parsed.error } }
	if (!access.canEditFooter && (sheetFooter(parsed.value.teacherSheet) || sheetFooter(parsed.value.studentSheet))) return { error: { code: 403, message: 'Ваша лицензия не разрешает изменять подпись внизу листа' } }
	const worklist = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
		if (parsed.value.personalFolderId && !await tx.studioFolder.findFirst({ where: { id: parsed.value.personalFolderId, ownerId: userId } })) return null
		const last = await tx.studioWorklist.findFirst({
			where: { ownerId: userId },
			orderBy: { position: 'desc' },
			select: { position: true },
		})
		return tx.studioWorklist.create({
			data: {
				ownerId: userId,
				name: parsed.value.name,
				teacherSheet: JSON.stringify(parsed.value.teacherSheet),
				studentSheet: JSON.stringify(parsed.value.studentSheet),
				...(parsed.value.courseId === undefined ? {} : { courseId: parsed.value.courseId }),
				...(parsed.value.folderId === undefined ? {} : { folderId: parsed.value.folderId }),
				personalFolderId: parsed.value.personalFolderId ?? null,
				position: (last?.position ?? -1) + 1,
			},
		})
	})
	if (!worklist) return { error: { code: 404, message: 'Личная папка не найдена' } }
	return {
		response: {
			...worklist,
			teacherSheet: JSON.parse(worklist.teacherSheet),
			studentSheet: JSON.parse(worklist.studentSheet),
		},
	}
}))

export default handler
