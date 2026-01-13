import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { Subscription } from "@/lib/dto/subscription";
const prisma = usePrisma()
const handler = getDefaultHandler()
handler.post(response(async (req, res) => {
	const { id } = JSON.parse(req.body)
	if (!id) return { response: [] as Subscription[] }
	const data = await prisma.subscription.findMany({
		where: {
			userId: id,
			canceled: false
		}
	}) as Subscription[]
	return { response: data }
}))
export default handler
