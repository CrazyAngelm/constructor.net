import { PrismaClient, User, Version } from "@prisma/client";

import { UserDto } from "@/lib/dto/users";

import { getDefaultHandler } from "@/lib/api/apiHandler";
import { Error, response } from "@/lib/api/response";
import { NextParsedUrlQuery } from "next/dist/server/request-meta";


const prisma = new PrismaClient()
const handler = getDefaultHandler()

interface Query extends NextParsedUrlQuery {
	id?: string
}

handler.get(response(async (req, res) => {
	const { id } = req.query as Query
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const resp = await prisma.version.findUnique({
		where: { id }
	})

	if (!resp) return { error: { code: 400, message: 'Несуществующий пользователь' } }

	return { response: resp };
}
))

handler.post(response(async (req, res) => {
	const { id } = req.query as Query
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }

	const data = req.body as Version

	const { id: _, ...dataWithoutId } = data

	const resp = await prisma.version.upsert({
		where: { id },
		create: dataWithoutId,
		update: dataWithoutId
	})

	return { response: resp }
}))

export default handler
