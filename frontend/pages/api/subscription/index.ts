import { getDefaultHandler } from '@/lib/api/apiHandler'
import { responseAuth } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
import { Subscription } from '@/lib/dto/subscription'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.post(responseAuth(async (_req, _res, userId) => {
	const data = await prisma.subscription.findMany({
		where: {
			userId,
			canceled: false,
		},
	}) as Subscription[]
	return { response: data }
}))
export default handler
