import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
const handler = getDefaultHandler()
handler.get(response(async () => {
	return { response: { avialable: true } }
})
)
export default handler
