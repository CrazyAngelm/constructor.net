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
	const data = await prisma.taskCategory.findUnique({
		where: { id },
		include: {
			CategoryParent: {
				where: { children: { deleted: false } },
				include: { children: true }
			}
		}
	})
	if (data == null) return { error: { code: 402, message: "Неверный запрос" } }
	const resp: TaskCategoryDto[] = data.CategoryParent.map(p => p.children)
	return { response: resp }
})
)
export default handler
