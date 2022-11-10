import { NextParsedUrlQuery } from "next/dist/server/request-meta";

import { PrismaClient } from "@prisma/client";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { TaskCategoryDto } from "@/lib/dto/tasks";



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
			CourseToCategory: {
				where: {
					category: {
						deleted: false
					}
				},
				include: {
					category: true
				}
			}
		}
	})

	if (data == null) return { error: { code: 402, message: "Неверный запрос" } }

	const resp: TaskCategoryDto[] = data.CourseToCategory.map(p => {
		return { ...p.category }
	})

	return { response: resp }
})
)

export default handler
