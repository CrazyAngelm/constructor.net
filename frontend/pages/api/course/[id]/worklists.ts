import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
const prisma = usePrisma()
const handler = getDefaultHandler()
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.get(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const data = await prisma.course.findUnique({
		where: { id },
		include: {
			CourseToWorklist: {
				include: {
					worklist: {
						select: {
							id: true,
							name: true,
							date: true
						}
					}
				}
			}
		}
	})
	return { response: data?.CourseToWorklist.map(p => p.worklist) }
})
)
export default handler
