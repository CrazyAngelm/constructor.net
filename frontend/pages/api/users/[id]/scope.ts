import { PrismaClient, User } from '@prisma/client'
import { UserDto } from '@/lib/dto/users'
import { getDefaultHandler } from '@/lib/api/apiHandler'
import { Error, responseAdmin } from '@/lib/api/response'
import { NextParsedUrlQuery } from 'next/dist/server/request-meta'
const prisma = new PrismaClient()
const handler = getDefaultHandler()
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.post(responseAdmin(async (req, res) => {
	const { id } = req.query as Query
	if (!id) return { error: { code: 400, message: 'Неверный индекс' } }
	const body = req.body as { scope: string, active: boolean }
	const scopeId = await prisma.scope.findFirst({ where: { value: body.scope } })
	if (!scopeId) return { error: { code: 400, message: 'Значения не существует' } }
	const scopes = await prisma.scopeJoin.findMany({
		where: {
			userId: id,
		},
		include: {
			scope: true,
		},
	})
	const scope = scopes.find(p => p.scope.value === body.scope)
	if (body.active && !scope) await prisma.scopeJoin.create({
		data: {
			userId: id,
			scopeId: scopeId.id,
		},
	})
	if (!body.active && scope) await prisma.scopeJoin.deleteMany({
		where:{
			userId:id,
			scopeId:scopeId.id,
		},
	})
	return { response: { status: 'Ok' } }
}))
export default handler
