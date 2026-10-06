import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAdmin } from '@/lib/api/response'
import { parseVisibility } from '@/lib/studio/validation'

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.patch(responseAdmin(async (req) => {
	const id = Number(req.query.id)
	if (!Number.isSafeInteger(id) || id < 1) return { error: { code: 400, message: 'Некорректная папка заданий' } }
	const parsed = parseVisibility(req.body)
	if ('error' in parsed) return { error: { code: 400, message: parsed.error } }
	const updated = await prisma.taskCategory.updateMany({ where: { id, deleted: false }, data: { visible: parsed.value } })
	if (!updated.count) return { error: { code: 404, message: 'Папка заданий не найдена' } }
	return { response: { id, visible: parsed.value } }
}))

export default handler
