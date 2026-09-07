import { expect, it, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { getStudioCatalogAccess } from './access'

it('includes both license-bundled courses and user-selected courses', async () => {
	const prisma = {
		user: { findUnique: vi.fn().mockResolvedValue({ scopes: [] }) },
		subscription: { findFirst: vi.fn().mockResolvedValue({ courses: '[2,3]', license: { courses: '[1,2]' } }) },
	} as unknown as PrismaClient
	expect(await getStudioCatalogAccess(prisma, 'test-user')).toEqual({ isAdmin: false, courseIds: [ 2, 3, 1 ] })
})
