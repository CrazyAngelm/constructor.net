import { PrismaClient } from "@prisma/client";

import { CreateCategoryDto, TaskCategoryDto } from "@/lib/dto/tasks";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { usePrisma } from "@/lib/api/database";


const prisma = usePrisma()
const handler = getDefaultHandler()

interface Query extends NextParsedUrlQuery {
	id?: string
}

handler.post(response(async (req, res) => {
	const data = req.body as CreateCategoryDto

	const upset = await prisma.taskCategory.create({
		data: {
			name: "Без названия",
			description: "",
			date: new Date().toISOString()
		}
	})
	if (data.courseParent)
		await prisma.courseToCategory.create({
			data: {
				courseId: data.parentId,
				categoryId: upset.id
			}
		})
	else
		await prisma.categoryToCategory.create({
			data: {
				parentId: data.parentId,
				childrenId: upset.id,
			}
		})

	return { response: upset as TaskCategoryDto }
}))

export default handler
