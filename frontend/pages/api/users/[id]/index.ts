import { PrismaClient, User } from '@prisma/client'
import { UserDto } from '@/lib/dto/users'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { Error, response } from '@/lib/api/response'
import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
const prisma = new PrismaClient()
const handler = getDefaultHandler()
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.get(response(async (req, res) => {
	const { id } = req.query as Query
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const user = await prisma.user.findUnique({
		where: { id },
	}) as UserDto
	if (!user) return { error: { code: 400, message: 'Несуществующий пользователь' } }
	user.scopes = (await prisma.scopeJoin.findMany({
		where: { userId: user.id },
		include: { scope: true },
	})).map(p => p.scope.value)
	return { response: user }
}))
handler.post(response(async (req, res) => {
	const { id } = req.query as Query
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const user = req.body as UserDto
	await prisma.user.update({
		where: { id },
		data: {
			name: user.name,
			email: user.email,
		},
	})
	return { response: { user } }
}))
export default handler
