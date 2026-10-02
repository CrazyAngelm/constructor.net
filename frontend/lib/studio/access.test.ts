import { expect, it, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { getStudioCatalogAccess } from './access'

it('includes both license-bundled courses and user-selected courses', async () => {
	const prisma = {
		user: { findUnique: vi.fn().mockResolvedValue({ scopes: [] }) },
		subscription: { findFirst: vi.fn().mockResolvedValue({ courses: '[2,3]', license: { courses: '[1,2]' } }) },
	} as unknown as PrismaClient
	expect(await getStudioCatalogAccess(prisma, 'test-user')).toEqual({ isAdmin: false, courseIds: [ 2, 3, 1 ], canEditFooter: false })
})

it('grants an unlimited subscriber only currently published courses', async () => {
	const prisma = {
		user: { findUnique: vi.fn().mockResolvedValue({ scopes: [] }) },
		subscription: { findFirst: vi.fn().mockResolvedValue({ courses: '[2]', license: { id: 10, name: 'Без ограничений', price: 999, published: true, unlimitedCourses: true } }) },
		course: { findMany: vi.fn().mockResolvedValue([ { id: 1 }, { id: 3 } ]) },
	} as unknown as PrismaClient
	expect(await getStudioCatalogAccess(prisma, 'test-user')).toEqual({ isAdmin: false, courseIds: [ 1, 3 ], canEditFooter: true })
	expect(prisma.course.findMany).toHaveBeenCalledWith({ where: { deleted: false, visible: true }, select: { id: true } })
})
