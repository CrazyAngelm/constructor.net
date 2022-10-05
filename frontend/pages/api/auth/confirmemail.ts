
import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";

const prisma = usePrisma()
const handler = getDefaultHandler()

interface Token{
	id?:string,
	email?:string,
	pass?:string
}

handler.post(response(async (req, res) => {
	const { token } = req.body

	const userToken = JSON.parse(Buffer.from(token, 'base64').toString('binary')) as Token

	console.log(userToken)

	if(!userToken || !userToken.id || !userToken.email) return {error:{code:422, message: "Неверный токен"}}


	const user = await prisma.user.findUnique({where:{
		id: userToken.id
	}})

	if(!user || user.email !== userToken.email) return {error:{code:422, message: "Пользователь с такими данными не найден, возможно ссылка сильно устарела"}}

	if(user.emailVerified) return {response:{status: "Пользователь уже подтвержден"}}

	await prisma.user.update({
		where:{
			id:user.id
		},
		data:{
			emailVerified: (new Date()).toISOString()
		}
	})
	return { response: { status: "Пользователь успешно подтвержден" } }
}))

export default handler

