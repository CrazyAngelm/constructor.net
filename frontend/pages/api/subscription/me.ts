import { getDefaultHandler } from "@/lib/api/apiHandler";
import { responseAuth } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { Subscription } from "@/lib/dto/subscription";

const prisma = usePrisma()
const handler = getDefaultHandler()


handler.get(responseAuth(async (req, res, userId) => {

	const data = await prisma.subscription.findFirst({
		where: { userId: userId, canceled: false },
		include: { license: true }
	})

	return { response: data }
}))

export default handler
