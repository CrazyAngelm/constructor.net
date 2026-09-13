import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { getStudioCatalogAccess } from '@/lib/studio/access'
import { synchronizeCatalog } from '@/lib/studio/catalogSync'

const prisma = getPrisma()
const handler = getDefaultHandler()
let activeSync: Promise<Awaited<ReturnType<typeof synchronizeCatalog>>> | undefined

handler.post(responseAuth(async (_req, _res, userId) => {
	if (!await getStudioCatalogAccess(prisma, userId)) return { error: { code: 403, message: 'Требуется действующая подписка или пробный период' } }
	try {
		if (!activeSync) activeSync = synchronizeCatalog(prisma).finally(() => { activeSync = undefined })
		return { response: await activeSync }
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Catalog synchronization failed', error)
		return { error: { code: 503, message: 'Не удалось получить актуальный каталог с основного сервера. Текущий каталог и черновик сохранены.' } }
	}
}))

export default handler
