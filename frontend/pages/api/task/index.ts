import { PrismaClient } from "@prisma/client";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";


const prisma = new PrismaClient()
const handler = getDefaultHandler()

handler.get(response(async () => {
	const tasks = await prisma.task.findMany()

	return { response: tasks }
})
)

export default handler
