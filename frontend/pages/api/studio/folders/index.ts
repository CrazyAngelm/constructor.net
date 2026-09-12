import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { getStudioCatalogAccess } from '@/lib/studio/access'

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.get(responseAuth(async (_req, _res, userId) => {
	if (!await getStudioCatalogAccess(prisma, userId)) return { error: { code: 403, message: 'Требуется активная подписка' } }
	return { response: { folders: await prisma.studioFolder.findMany({ where: { ownerId: userId }, orderBy: { name: 'asc' }, select: { id: true, name: true } }) } }
}))

handler.post(responseAuth(async (req, _res, userId) => {
	if (!await getStudioCatalogAccess(prisma, userId)) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
	// StudioFolder.name is VARCHAR(191).
	if (!name || name.length > 191) return { error: { code: 400, message: 'Введите название папки (до 191 символа)' } }
	return { response: await prisma.studioFolder.create({ data: { ownerId: userId, name }, select: { id: true, name: true } }) }
}))

export default handler
