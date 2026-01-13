import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { Manual } from "@/lib/dto/manuals";
import { LicenseDto } from "@/lib/dto/subscription";
const prisma = usePrisma()
const handler = getDefaultHandler()
handler.get(response(async () => {
	const data = await prisma.license.findMany()
	return { response: data }
})
)
export default handler
