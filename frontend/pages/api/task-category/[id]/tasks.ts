import { NextParsedUrlQuery } from "next/dist/server/request-meta";

import { PrismaClient } from "@prisma/client";

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
	if (!id) return { error: { code: 400, msg: 'Неверный индекс' } }

	const data = await prisma.taskCategory.findUnique({
		where: { id },
		include: {
			CategoryToTask: {
				include: {
					task: true
				}
			}
		}
	})

	return { response: data?.CategoryToTask.map(p => p.task) }
})
)

export default handler
