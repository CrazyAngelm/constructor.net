import { PrismaClient } from "@prisma/client";

import { TaskCategoryDto } from "@/lib/dto/tasks";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";


const prisma = usePrisma()
const handler = getDefaultHandler()
//obsolete
handler.get(response(async () => {
	const data = await prisma.taskCategory.findMany({
		include: {
			CategoryChildren:true
		}
	})

	return { response: data }
})
)

export default handler
