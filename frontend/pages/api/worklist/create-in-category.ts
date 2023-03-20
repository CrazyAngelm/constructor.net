
import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { usePrisma } from "@/lib/api/database";
import { CreateWorklistInCategoryDto } from "@/lib/dto/worklist";


const prisma = usePrisma()
const handler = getDefaultHandler()


handler.post(response(async (req, res) => {
	const data = req.body as CreateWorklistInCategoryDto


	const isWorklistName = await prisma.categoryToWorklist.findFirst({
		where: {
			categoryId: data.categoryId,
			worklist: {
				name: data.name
			}
		}
	})

	if (isWorklistName) return {
		error: {
			code: 400,
			message: "В данной категории уже существует конспект с таким названием"
		}
	}

	const created = await prisma.worklist.create({
		data: {
			name: data.name,
			json: data.json,
			date: new Date().toISOString()
		}
	})

	await prisma.categoryToWorklist.create({
		data: {
			categoryId: data.categoryId,
			worklistId: created.id
		}
	})

	return { response: true }
}))

export default handler
