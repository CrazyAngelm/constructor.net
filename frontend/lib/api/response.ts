import { compare } from 'bcryptjs'
import { NextApiRequest, NextApiResponse } from 'next'
import { FromBase64 } from '../Base64'
import { getPrisma } from './database'
import { ScopeEnum } from '../dto/users'
import { getToken } from 'next-auth/jwt'
import { previewAuthCookies } from '../auth/cookies'

const prisma = getPrisma()

export interface Error {
	code: number
	message?: string
}

export interface Response<T> {
	response?: T
	error?: Error
}

const respondUnexpected = (req: NextApiRequest, res: NextApiResponse, err: unknown) => {
	console.error('API request failed', {
		method: req.method,
		url: req.url,
		error: err instanceof Error ? err.message : 'Unknown error',
	})
	res.status(500).json({
		code: 500,
		message: 'Внутренняя ошибка сервера',
	})
}

interface AuthenticatedApiUser {
	id: string
	scopes: string[]
}

const getBasicCredentials = (authorization?: string): { id: string, password: string } | null => {
	if (!authorization?.startsWith('Basic ')) return null
	const encoded = authorization.slice('Basic '.length)
	const decoded = FromBase64(encoded)
	const delimiter = decoded.indexOf(':')
	if (delimiter < 1) return null
	return {
		id: decoded.slice(0, delimiter),
		password: decoded.slice(delimiter + 1),
	}
}

export const getAuthenticatedApiUser = async (req: NextApiRequest): Promise<AuthenticatedApiUser | null> => {
	try {
		const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, cookieName: previewAuthCookies()?.sessionToken.name })
		if (token?.sub) {
			const user = await prisma.user.findUnique({
				where: { id: token.sub },
				include: { scopes: { include: { scope: true } } },
			})
			if (user) return { id: user.id, scopes: user.scopes.map((item) => item.scope.value) }
		}
	} catch {
		// A Basic-auth client can legitimately have no NextAuth JWT.
	}

	try {
		const credentials = getBasicCredentials(req.headers.authorization)
		if (!credentials?.password) return null
		const user = await prisma.user.findUnique({
			where: { id: credentials.id },
			include: { scopes: { include: { scope: true } } },
		})
		if (!user || !(await compare(credentials.password, user.password ?? ''))) return null
		return { id: user.id, scopes: user.scopes.map((item) => item.scope.value) }
	} catch {
		return null
	}
}

export const response = <T>(getResponse: (req: NextApiRequest, res: NextApiResponse)
	=> Promise<Response<T>>)
	: (req: NextApiRequest, res: NextApiResponse) => Promise<void> => {
	return async (req, res) => {
		try {
			const resp = await getResponse(req, res)
			if (resp.error) {
				res.status(resp.error.code).json((resp.error))
				return
			}
			res.status(200).json(resp.response)
		} catch (err) {
			respondUnexpected(req, res, err)
		}
	}
}

export const responseAuth = <T>(getResponse: (req: NextApiRequest, res: NextApiResponse, userId: string)
	=> Promise<Response<T>>)
	: (req: NextApiRequest, res: NextApiResponse) => Promise<void> => {
	return async (req, res) => {
		const user = await getAuthenticatedApiUser(req)
		if (!user) {
			res.status(401).end('Неверные данные авторизации')
			return
		}

		try {
			const resp = await getResponse(req, res, user.id)
			if (resp.error) {
				res.status(resp.error.code).json((resp.error))
				return
			}
			res.status(200).json(resp.response)
		} catch (err) {
			respondUnexpected(req, res, err)
		}
	}
}

export const responseAdmin = <T>(getResponse: (req: NextApiRequest, res: NextApiResponse, userId: string)
	=> Promise<Response<T>>)
	: (req: NextApiRequest, res: NextApiResponse) => Promise<void> => {
	return async (req, res) => {
		const user = await getAuthenticatedApiUser(req)
		if (!user) {
			res.status(401).end('Неверные данные авторизации')
			return
		}
		if (!user.scopes.includes(ScopeEnum.admin)) {
			res.status(403).end('Недостаточно прав пользователя')
			return
		}

		try {
			const resp = await getResponse(req, res, user.id)
			if (resp.error) {
				res.status(resp.error.code).json((resp.error))
				return
			}
			res.status(200).json(resp.response)
		} catch (err) {
			respondUnexpected(req, res, err)
		}
	}
}
