import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
const prisma = getPrisma()
const handler = getDefaultHandler()
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.get(response(async (req, res) => {
	const id = (req.query as Query).id as string
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const data = await prisma.folder.findUnique({
		where: { id },
		include: {
			FolderToWorklist: {
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
	return { response: data?.FolderToWorklist.map(p => p.worklist) }
}))
export default handler
