import { PrismaClient } from "@prisma/client";

import { CreateCategoryDto, TaskCategoryDto } from "@/lib/dto/tasks";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response, responseAdmin } from "@/lib/api/response";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { usePrisma } from "@/lib/api/database";
import { CreateManual, Manual } from "@/lib/dto/manuals";


const prisma = usePrisma()
const handler = getDefaultHandler()

handler.post(responseAdmin(async (req, res) => {
	const data = req.body as CreateManual

	const created = await prisma.manual.create({
		data: {
			name: "New Manual",
			html: "<h1>New Manual</h1>",
			date: new Date().toISOString()
		}
	})

	if (data.parentId && data.parentId >= 0)
		await prisma.manualToManula.create({
			data: {
				parentId: data.parentId,
				childrenId: created.id
			}
		})

	return { response: created as Manual }
}))

export default handler
