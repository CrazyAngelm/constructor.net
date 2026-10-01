import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAdmin } from '@/lib/api/response'

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.patch(responseAdmin(async (req, _res, userId) => {
	const id = typeof req.query.id === 'string' ? req.query.id : ''
	if (!id || typeof req.body?.published !== 'boolean') return { error: { code: 400, message: 'Укажите конспект и действие публикации' } }
	const worklist = await prisma.studioWorklist.findFirst({ where: { id, ownerId: userId } })
	if (!worklist) return { error: { code: 404, message: 'Конспект не найден' } }
	if (req.body.published) {
		if (!worklist.courseId || !await prisma.course.findFirst({ where: { id: worklist.courseId, deleted: false, visible: true } })) return { error: { code: 400, message: 'Сохраните конспект в опубликованном курсе. Программа будет доступна пользователям этого курса.' } }
		if (![worklist.teacherSheet, worklist.studentSheet].some(sheet => JSON.parse(sheet).data.items.length > 0)) return { error: { code: 400, message: 'Добавьте задания перед публикацией' } }
	}
	const updated = await prisma.studioWorklist.update({ where: { id }, data: { published: req.body.published } })
	return { response: { ...updated, teacherSheet: JSON.parse(updated.teacherSheet), studentSheet: JSON.parse(updated.studentSheet) } }
}))

export default handler
