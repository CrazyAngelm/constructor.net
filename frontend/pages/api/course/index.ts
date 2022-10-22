import { PrismaClient } from "@prisma/client";

import { CourseDto } from "@/lib/dto/tasks";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";


const prisma = usePrisma()
const handler = getDefaultHandler()

handler.get(response(async () => {
	const data = await prisma.course.findMany({
		include: {
			CourseToCategory: {
				select: {
					categoryId: true
				}
			}
		}
	})

	const resp: CourseDto[] = data.map(p => {
		return {
			...p,
			categories: p.CourseToCategory.map(p => p.categoryId)
		}
	})

	return { response: resp }
})
)

export default handler
