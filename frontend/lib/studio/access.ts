import { PrismaClient } from '@prisma/client'
import { ScopeEnum } from '@/lib/dto/users'

export interface StudioCatalogAccess {
	isAdmin: boolean
	courseIds: number[]
}

const parseCourseIds = (value: string | null): number[] => {
	if (!value) return []
	try {
		const parsed = JSON.parse(value)
		return Array.isArray(parsed) && parsed.every((id) => Number.isSafeInteger(id) && id > 0) ? parsed : []
	} catch {
		return []
	}
}

export const getStudioCatalogAccess = async (
	prisma: PrismaClient,
	userId: string
): Promise<StudioCatalogAccess | null> => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { scopes: { include: { scope: true } } },
	})
	if (!user) return null
	const isAdmin = user.scopes.some((item) => item.scope.value === ScopeEnum.admin)
	if (isAdmin) return { isAdmin: true, courseIds: [] }

	const subscription = await prisma.subscription.findFirst({
		where: {
			userId,
			active: true,
			canceled: false,
			AND: [{ OR: [{ endDate: null }, { endDate: { gte: new Date() } }] }],
		},
		include: { license: true },
		orderBy: { startDate: 'desc' },
	})
	if (!subscription) return null
	const selectedCourses = parseCourseIds(subscription.courses)
	return { isAdmin: false, courseIds: [ ...new Set([...selectedCourses, ...parseCourseIds(subscription.license.courses)]) ] }
}
