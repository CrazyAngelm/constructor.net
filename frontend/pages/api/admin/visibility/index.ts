import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAdmin } from '@/lib/api/response'

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.get(responseAdmin(async () => {
	const [ courses, folders ] = await Promise.all([
		prisma.course.findMany({
			where: { deleted: false },
			select: { id: true, name: true, visible: true },
			orderBy: { name: 'asc' },
		}),
		prisma.folder.findMany({
			where: { deleted: false },
			select: { id: true, name: true, visible: true },
			orderBy: { name: 'asc' },
		}),
	])

	return { response: { courses, folders } }
}))

export default handler
