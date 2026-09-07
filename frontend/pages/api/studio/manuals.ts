import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { getStudioCatalogAccess } from '@/lib/studio/access'
import { sanitizeManualHtml } from '@/lib/manuals/sanitize'

const prisma = getPrisma()
const handler = getDefaultHandler()
handler.get(responseAuth(async (_req, _res, userId) => {
	if (!await getStudioCatalogAccess(prisma, userId)) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const manuals = await prisma.manual.findMany({ where: { deleted: false }, orderBy: { id: 'asc' }, select: { id: true, name: true, html: true } })
	return { response: { manuals: manuals.map((manual) => ({ ...manual, html: sanitizeManualHtml(manual.html) })) } }
}))
export default handler
