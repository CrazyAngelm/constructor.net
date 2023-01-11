import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { UnsubscribeReq } from "@/lib/dto/subscription";

const prisma = usePrisma()
const handler = getDefaultHandler()


handler.post(response(async (req, res) => {
	const body = JSON.parse(req.body) as UnsubscribeReq

	const data = await prisma.subscription.updateMany({
		where: { id: body.subscriptionId, userId: body.userId },
		data: { canceled: true }
	})

	if (!data || data.count == 0) return { error: { code: 415, message: 'Подписки не найдено' } }

	return { response: {} }
}))

export default handler
