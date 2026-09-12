import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { parseWorklistOrder } from '@/lib/studio/validation'
import { getStudioCatalogAccess } from '@/lib/studio/access'

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.post(responseAuth(async (req, _res, userId) => {
	const access = await getStudioCatalogAccess(prisma, userId)
	if (!access) return { error: { code: 403, message: 'Требуется активная подписка' } }
	const parsed = parseWorklistOrder(req.body)
	if ('error' in parsed) return { error: { code: 400, message: parsed.error } }
	const requested = await prisma.studioWorklist.findMany({
		where: { id: { in: parsed.value } },
		select: { id: true, ownerId: true },
	})
	if (requested.length !== parsed.value.length || (!access.isAdmin && requested.some((item) => item.ownerId !== userId))) {
		return { error: { code: 404, message: 'Ворклист не найден' } }
	}
	const ownerIds = new Set(requested.map((item) => item.ownerId))
	if (ownerIds.size !== 1) return { error: { code: 400, message: 'Порядок задаётся для ворклистов одного владельца' } }
	const ownerId = requested[0]?.ownerId
	if (!ownerId) return { error: { code: 404, message: 'Ворклист не найден' } }
	const total = await prisma.studioWorklist.count({ where: { ownerId } })
	if (total !== parsed.value.length) return { error: { code: 400, message: 'Передайте полный порядок ворклистов владельца' } }

	await prisma.$transaction(parsed.value.map((id, position) => prisma.studioWorklist.update({
		where: { id },
		data: { position },
	})))
	return { response: { reordered: true } }
}))

export default handler
