import { CreateCategoryDto, TaskCategoryDto } from "@/lib/dto/tasks";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response, responseAdmin } from "@/lib/api/response";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { usePrisma } from "@/lib/api/database";
import { CreateFolderDto, FolderDto } from "@/lib/dto/worklist";


const prisma = usePrisma()
const handler = getDefaultHandler()

interface Query extends NextParsedUrlQuery {
	id?: string
}

handler.post(responseAdmin(async (req, res) => {
	const data = req.body as CreateFolderDto

	const upset = await prisma.folder.create({
		data: {
			name: "Новая папка",
			date: new Date().toISOString(),
			deleted: false
		}
	})

	if (data.parentCourseId) {
		await prisma.folderToCourse.create({
			data: {
				courseId: data.parentCourseId,
				folderId: upset.id
			}
		})
	}

	if (data.parentFolderId) {
		await prisma.folderToFolder.create({
			data: {
				parentId: data.parentFolderId,
				childrenId: upset.id
			}
		})
	}

	return { response: upset as FolderDto }
}))

export default handler
