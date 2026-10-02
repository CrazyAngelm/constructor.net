import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { getStudioCatalogAccess } from '@/lib/studio/access'

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.put(responseAuth(async (req, _res, userId) => {
	if (!await getStudioCatalogAccess(prisma, userId)) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const id = typeof req.query.id === 'string' ? req.query.id : ''
	const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
	if (!name || name.length > 191) return { error: { code: 400, message: 'Введите название папки (до 191 символа)' } }
	const result = await prisma.studioFolder.updateMany({ where: { id, ownerId: userId }, data: { name } })
	if (!result.count) return { error: { code: 404, message: 'Личная папка не найдена' } }
	return { response: { id, name } }
}))

handler.delete(responseAuth(async (req, _res, userId) => {
	if (!await getStudioCatalogAccess(prisma, userId)) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const id = typeof req.query.id === 'string' ? req.query.id : ''
	// FK ON DELETE SET NULL preserves every saved worklist.
	const result = await prisma.studioFolder.deleteMany({ where: { id, ownerId: userId } })
	if (!result.count) return { error: { code: 404, message: 'Личная папка не найдена' } }
	return { response: { deleted: true } }
}))

export default handler
