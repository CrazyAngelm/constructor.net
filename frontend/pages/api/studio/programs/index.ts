import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { getStudioCatalogAccess } from '@/lib/studio/access'
import { publishedProgramFilter } from '@/lib/studio/programs'

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.get(responseAuth(async (_req, _res, userId) => {
	const access = await getStudioCatalogAccess(prisma, userId)
	if (!access) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const current = await prisma.studioWorklist.findMany({ where: publishedProgramFilter(access), select: { id: true, name: true, courseId: true, course: { select: { name: true } } }, orderBy: { name: 'asc' } })
	// The new library is curated through explicit publication. Old application
	// worklists stay intact and accessible through its compatibility API.
	return { response: { programs: current.map(item => ({ id: item.id, name: item.name, courseId: item.courseId, courseName: item.course!.name })) } }
}))

export default handler
