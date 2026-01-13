import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { hash } from 'bcryptjs';
const prisma = usePrisma()
const handler = getDefaultHandler()
handler.post(response(async (req, res) => {
	const { id, password, newPassword } = req.body
	if (!id || !password) return { error: { code: 422, message: "email or password not found" } }
	const user = await prisma.user.findUnique({
		where: {
			id
		}
	})
	if (!user) return { error: { code: 422, message: "Данные для сьроса пароля неверные или устарели" } }
	const checkPassword = password === user.password
	if (!checkPassword) return { error: { code: 422, message: "Данные для сьроса пароля неверные или устарели" } }
	const newPass = await prisma.user.update({
		where:{id},
		data: {
			password: await hash(newPassword, 12)
		}
	})
	return { response: { status: "пароль сменен" } }
}))
export default handler
