import { PrismaClient } from "@prisma/client";

import { CourseDto } from "@/lib/dto/tasks";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";


const prisma = new PrismaClient()
const handler = getDefaultHandler()

handler.get(response(async () => {
	const courses = await prisma.course.findMany({
		include: {
			taskCategories: {
				select: { id: true }
			}
		}
	})
	const resp = courses.map(c => {
		const { taskCategories, ...props } = c
		const dto = props as CourseDto
		dto.taskCategoriesId = taskCategories.map(t => t.id)
		return dto
	})

	return { response: resp }
})
)

export default handler
