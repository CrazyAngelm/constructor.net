import { PrismaClient } from "@prisma/client";

import { TaskCategoryDto } from "@/lib/dto/tasks";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";


const prisma = new PrismaClient()
const handler = getDefaultHandler()

handler.get(response(async () => {
	const categories = await prisma.taskCategory.findMany({
		include: {
			tasks: {
				select: { id: true }
			}
		}
	})
	const resp = categories.map(c => {
		const { tasks, ...props } = c
		const dto = props as TaskCategoryDto
		dto.tasksId = tasks.map(t => t.id)
		return dto
	})

	return { response: resp }
})
)

export default handler
