import { PrismaClient } from "@prisma/client";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { TaskCategoryDto, TaskDto } from "@/lib/dto/tasks";
import multer from 'multer'


const prisma = new PrismaClient()
const handler = getDefaultHandler()

const upload = multer({
	storage: multer.diskStorage({
		destination: './public/uploads',
		filename: (req, file, cb) => cb(null, file.originalname),
	}),
});

interface Query extends NextParsedUrlQuery {
	id?: string
}

handler.use(upload.array('theFiles'))

handler.post(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	if (!id) return { error: { code: 400, msg: 'Неверный индекс' } }



	return { response: { status: 'Ok' } }
}))

export const config = {
	api: {
		bodyParser: false, // Disallow body parsing, consume as stream
	},
};

export default handler
