import { PrismaClient } from "@prisma/client";

import { TaskCategoryDto } from "@/lib/dto/tasks";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";


const prisma = usePrisma()
const handler = getDefaultHandler()

handler.get(response(async () => {
	const data = await prisma.taskCategory.findMany()

	return { response: data }
})
)

export default handler
