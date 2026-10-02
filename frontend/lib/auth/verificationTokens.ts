import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

export type VerificationPurpose = 'confirm-email' | 'reset-password'

const tokenPrefix = 'labstudio-auth:'

const getTokenLifetimeMs = (): number => {
	const rawValue = process.env.AUTH_VERIFICATION_TOKEN_TTL_MINUTES
	const minutes = rawValue ? Number(rawValue) : Number.NaN
	if (!Number.isSafeInteger(minutes) || minutes <= 0) {
		throw new Error('AUTH_VERIFICATION_TOKEN_TTL_MINUTES must be a positive integer')
	}
	return minutes * 60_000
}

const getIdentifier = (purpose: VerificationPurpose, userId: string) => `${tokenPrefix}${purpose}:${userId}`

export const isNonEmptyString = (value: unknown): value is string =>
	typeof value === 'string' && value.trim().length > 0

export const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

export const isEmail = (value: unknown): value is string =>
	typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export const issueVerificationToken = async (
	prisma: PrismaClient,
	purpose: VerificationPurpose,
	userId: string,
): Promise<string> => {
	const identifier = getIdentifier(purpose, userId)
	const token = randomBytes(32).toString('base64url')
	const expires = new Date(Date.now() + getTokenLifetimeMs())

	await prisma.$transaction([
		prisma.verificationToken.deleteMany({ where: { identifier } }),
		prisma.verificationToken.create({ data: { identifier, token, expires } }),
	])

	return token
}

export const consumeVerificationToken = async (
	prisma: PrismaClient,
	purpose: VerificationPurpose,
	token: string,
): Promise<string | null> => {
	try {
		return await prisma.$transaction(async (tx) => {
			const verification = await tx.verificationToken.delete({ where: { token } })
			const prefix = `${tokenPrefix}${purpose}:`

			if (verification.expires <= new Date() || !verification.identifier.startsWith(prefix)) return null

			return verification.identifier.slice(prefix.length) || null
		})
	} catch {
		return null
	}
}
