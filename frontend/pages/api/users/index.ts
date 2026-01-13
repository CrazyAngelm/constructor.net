import { PrismaClient } from "@prisma/client";
import { UserDto } from "@/lib/dto/users";
import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
const prisma = new PrismaClient()
const handler = getDefaultHandler()
handler.get(response(async () => {
	const resp = (await prisma.user.findMany({
		include: {
			scopes: {
				include: {
					scope: true
				}
			}
		}
	})).map(user => {
		return {
			id: user.id,
			image: user.image,
			name: user.name,
			email: user.email,
			scopes: user.scopes.map(scope => scope.scope.value)
		} as UserDto
	})
	return { response: resp }
})
)
export default handler
