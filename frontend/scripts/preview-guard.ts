import { PrismaClient } from '@prisma/client'

export const requireEnvironment = (name: string): string => {
	const value = process.env[name]?.trim()
	if (!value) throw new Error(`${name} is required`)
	return value
}

export const requirePreviewConfirmation = (name: string): void => {
	if (process.env[name] !== 'YES') {
		throw new Error(`${name}=YES is required before modifying the preview database`)
	}
}

export const assertPreviewDatabase = async (prisma: PrismaClient): Promise<void> => {
	if (requireEnvironment('PREVIEW_DEPLOYMENT_MODE') !== 'isolated-preview') {
		throw new Error('PREVIEW_DEPLOYMENT_MODE must be isolated-preview')
	}
	const expectedName = requireEnvironment('PREVIEW_DB_NAME')
	if (!expectedName.toLowerCase().includes('preview')) {
		throw new Error('PREVIEW_DB_NAME must contain preview')
	}
	const databaseUrl = new URL(requireEnvironment('DATABASE_URL'))
	if (databaseUrl.hostname !== requireEnvironment('PREVIEW_DB_HOST')) {
		throw new Error('DATABASE_URL host does not match the isolated preview host')
	}
	if (decodeURIComponent(databaseUrl.pathname.replace(/^\//, '')) !== expectedName) {
		throw new Error('DATABASE_URL database does not match PREVIEW_DB_NAME')
	}
	const rows = await prisma.$queryRaw<Array<{ databaseName: string | null }>>`SELECT DATABASE() AS databaseName`
	if (rows[0]?.databaseName !== expectedName) {
		throw new Error('Connected database does not match PREVIEW_DB_NAME')
	}
}

export const assertEmptyCatalog = async (prisma: PrismaClient): Promise<void> => {
	const counts = await Promise.all([
		prisma.course.count(),
		prisma.taskCategory.count(),
		prisma.task.count(),
		prisma.courseToCategory.count(),
		prisma.categoryToCategory.count(),
		prisma.categoryToTask.count(),
		prisma.manual.count(),
	])
	if (counts.some((count) => count !== 0)) {
		throw new Error('Catalog tables are not empty; refusing to overwrite an existing preview catalog')
	}
}
