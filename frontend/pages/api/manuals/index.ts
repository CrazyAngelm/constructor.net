import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { Manual } from "@/lib/dto/manuals";


const prisma = usePrisma()
const handler = getDefaultHandler()

handler.get(response(async () => {
	const data = await prisma.manual.findMany({ where: { deleted: false } }) as Manual[]

	return { response: data }
})
)

export default handler
