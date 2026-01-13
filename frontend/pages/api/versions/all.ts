import { PrismaClient } from "@prisma/client";
import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { Version, VersionType } from "@/lib/dto/versions";
const prisma = new PrismaClient()
const handler = getDefaultHandler()
handler.get(response(async () => {
	const resp = await prisma.version.findMany() as Version[]
	return { response: resp }
})
)
export default handler
