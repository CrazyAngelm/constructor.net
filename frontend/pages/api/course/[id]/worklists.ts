import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response, getAuthenticatedApiUser } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
const prisma = getPrisma()
const handler = getDefaultHandler()
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.get(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const user = await getAuthenticatedApiUser(req)
	const data = await prisma.course.findFirst({
		where: { id, deleted: false, ...(user?.scopes.includes('admin') ? {} : { visible: true }) },
		include: {
			CourseToWorklist: {
				include: {
					worklist: {
						select: {
							id: true,
							name: true,
							date: true,
						},
					},
				},
			},
		},
	})
	return { response: data?.CourseToWorklist.map(p => p.worklist) }
}))
export default handler
