import { getDefaultHandler } from "@/lib/api/apiHandler";
import { responseAuth } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { Subscription } from "@/lib/dto/subscription";
import { ScopeEnum } from "@/lib/dto/users";
const prisma = usePrisma()
const handler = getDefaultHandler()
handler.get(responseAuth(async (req, res, userId) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { scopes: { include: { scope: true } } }
	})
	if (user?.scopes.find(p => p.scope.value == ScopeEnum.admin)) {
		return { response: true }
	}
	return { response: false }
}))
export default handler
