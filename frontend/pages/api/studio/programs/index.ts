import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { getStudioCatalogAccess } from '@/lib/studio/access'
import { accessibleLegacyPrograms, publishedProgramFilter } from '@/lib/studio/programs'

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.get(responseAuth(async (_req, _res, userId) => {
	const access = await getStudioCatalogAccess(prisma, userId)
	if (!access) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const current = await prisma.studioWorklist.findMany({ where: publishedProgramFilter(access), select: { id: true, name: true, courseId: true, course: { select: { name: true } } }, orderBy: { name: 'asc' } })
	const legacyAccess = await accessibleLegacyPrograms(prisma, access)
	const legacy = await prisma.worklist.findMany({ where: { id: { in: [...legacyAccess.keys()] }, json: { not: null } }, select: { id: true, name: true }, orderBy: { name: 'asc' } })
	return { response: { programs: [
		...current.map(item => ({ id: item.id, name: item.name, courseId: item.courseId, courseName: item.course!.name })),
		...legacy.map(item => ({ id: `legacy:${item.id}`, name: item.name || 'Конспект', ...legacyAccess.get(item.id)! })),
	] } }
}))

export default handler
