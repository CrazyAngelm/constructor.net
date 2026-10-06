import { describe, expect, it } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { consumeVerificationToken, isEmail, isNonEmptyString, isObject } from './verificationTokens'

describe('auth request payload validation', () => {
	it('accepts non-empty string passwords and rejects non-strings', () => {
		expect(isNonEmptyString('password')).toBe(true)
		expect(isNonEmptyString('   ')).toBe(false)
		expect(isNonEmptyString(undefined)).toBe(false)
	})

	it('requires a syntactically usable email address', () => {
		expect(isEmail('person@example.com')).toBe(true)
		expect(isEmail('not-an-email')).toBe(false)
		expect(isEmail({ email: 'person@example.com' })).toBe(false)
	})

	it('accepts only object request bodies', () => {
		expect(isObject({ token: 'opaque-token' })).toBe(true)
		expect(isObject(null)).toBe(false)
		expect(isObject([])).toBe(false)
	})
})

describe('one-time verification tokens', () => {
	const prismaFor = (identifier: string, expires: Date) => ({
		$transaction: async (operation: (tx: { verificationToken: { delete: () => Promise<{ identifier: string, expires: Date }> } }) => Promise<string | null>) =>
			operation({ verificationToken: { delete: async () => ({ identifier, expires }) } }),
	}) as unknown as PrismaClient

	it('returns the user identifier only for an unexpired token with the requested purpose', async () => {
		const result = await consumeVerificationToken(
			prismaFor('labstudio-auth:reset-password:user-123', new Date(Date.now() + 60_000)),
			'reset-password',
			'opaque-token',
		)

		expect(result).toBe('user-123')
	})

	it('rejects expired or cross-purpose tokens after consuming them', async () => {
		await expect(consumeVerificationToken(
			prismaFor('labstudio-auth:reset-password:user-123', new Date(Date.now() - 1)),
			'reset-password',
			'opaque-token',
		)).resolves.toBeNull()
		await expect(consumeVerificationToken(
			prismaFor('labstudio-auth:confirm-email:user-123', new Date(Date.now() + 60_000)),
			'reset-password',
			'opaque-token',
		)).resolves.toBeNull()
	})
})
