import type { NextApiRequest, NextApiResponse } from 'next'

import { getPrisma } from '@/lib/api/database'

const prisma = getPrisma()

const health = async (_req: NextApiRequest, res: NextApiResponse) => {
	try {
		await prisma.$queryRaw`SELECT 1`
		res.status(200).json({ status: 'ok', database: 'ok' })
	} catch (error) {
		console.error('Health check failed', error instanceof Error ? error.message : 'Unknown error')
		res.status(503).json({ status: 'unavailable' })
	}
}

export default health
