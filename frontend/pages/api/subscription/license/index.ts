import { getDefaultHandler } from '@/lib/api/apiHandler'
import { response } from '@/lib/api/response'
import { getPrisma } from '@/lib/api/database'
import { Manual } from '@/lib/dto/manuals'
import { LicenseDto } from '@/lib/dto/subscription'
import { previewExternalFlowsRestricted } from '@/lib/preview'
const prisma = getPrisma()
const handler = getDefaultHandler()
handler.get(response(async () => {
	const data = await prisma.license.findMany({ where: previewExternalFlowsRestricted()
		? { name: { not: process.env.PREVIEW_LICENSE_NAME } } : undefined })
	return { response: data }
}))
export default handler
