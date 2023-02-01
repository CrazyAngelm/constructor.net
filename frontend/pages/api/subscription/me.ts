import { getDefaultHandler } from "@/lib/api/apiHandler";
import { responseAuth } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { ScopeEnum } from "@/lib/dto/users";
import { License, Subscription } from "@prisma/client";

const prisma = usePrisma()
const handler = getDefaultHandler()


handler.get(responseAuth(async (req, res, userId) => {

	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { scopes: { include: { scope: true } } }
	})

	if (user?.scopes.find(p => p.scope.value === ScopeEnum.admin)) {
		return {
			response: { license: { name: 'admin' } }
		}
	}

	const data = await prisma.subscription.findFirst({
		where: { userId: userId, canceled: false },
		include: { license: true }
	})




	return { response: data }
}))

export default handler
