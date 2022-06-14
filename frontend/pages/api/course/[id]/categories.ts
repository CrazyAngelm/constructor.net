import { NextParsedUrlQuery } from "next/dist/server/request-meta";

import { PrismaClient } from "@prisma/client";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";



const prisma = new PrismaClient()
const handler = getDefaultHandler()

interface Query extends NextParsedUrlQuery {
	id?: string
}

handler.get(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, msg: 'Неверный индекс' } }

	const data = await prisma.course.findUnique({
		where: { id },
		include: {
			CourseToCategory:{
				include:{
					category:true
				}
			}
		}
	})

	return { response: data?.CourseToCategory.map(p => p.category) }
})
)

export default handler
