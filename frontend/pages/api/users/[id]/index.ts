import { PrismaClient } from "@prisma/client";

import { UserDto } from "@/common/users";

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
	if (!id) return { error: { code: 400, msg: 'Неверный индекс' } }
	const user = await prisma.user.findUnique({
		where: { id }
	}) as UserDto

	if (!user) return { error: { code: 400, msg: 'Несуществующий пользователь' } }

	user.scopes = (await prisma.scopeJoin.findMany({
		where: { userId: user.id },
		include: { scope: true }
	})).map(p => p.scope.value)

	return { response: user };
}
))

export default handler
