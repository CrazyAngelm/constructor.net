
import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response, responseAdmin } from "@/lib/api/response";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { usePrisma } from "@/lib/api/database";
import { CreateWorklistInCourse, FolderDto } from "@/lib/dto/worklist";


const prisma = usePrisma()
const handler = getDefaultHandler()


handler.post(responseAdmin(async (req, res) => {
	const data = req.body as CreateWorklistInCourse

	if (!data.courseId) return {
		error: {
			code: 400,
			message: "Конспект должен привязан к катеоргии или курсу"
		}
	}


	const isWorklistName = await prisma.courseToWorklist.findFirst({
		where: {
			courseId: data.courseId,
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

	await prisma.courseToWorklist.create({
		data: {
			courseId: data.courseId,
			worklistId: created.id
		}
	})

	return { response: created as FolderDto }
}))

export default handler
