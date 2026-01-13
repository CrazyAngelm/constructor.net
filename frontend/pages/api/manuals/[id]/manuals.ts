import { NextParsedUrlQuery } from "next/dist/server/request-meta";
import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { Manual } from "@/lib/dto/manuals";
const prisma = usePrisma()
const handler = getDefaultHandler()
interface Query extends NextParsedUrlQuery {
	id?: string
}
handler.get(response(async (req, res) => {
	const id = Number.parseInt((req.query as Query).id as string)
	const data = id >= 0
		? (await prisma.manual.findUnique({
			where: { id },
			include: {
				Children: {
					where: {
						children: {
							deleted: false
						}
					},
					include: {
						children: true
					}
				}
			}
		}))?.Children.map(p => p.children as Manual) as Manual[]
		: (await prisma.manual.findMany({
			where: {
				AND: {
					deleted: false,
					Parent: {
						none: {}
					}
				}
			}
		})) as Manual[]
	if (data == null) return { error: { code: 402, message: "Неверный запрос" } }
	return { response: data }
})
)
export default handler
