import { compare } from "bcryptjs"
import { NextApiRequest, NextApiResponse } from "next"
import { FromBase64 } from "../Base64"
import { usePrisma } from "./database"
import { ScopeEnum } from "../dto/users"

const prisma = usePrisma()

export interface Error {
	code: number
	message?: string
}

export interface Response<T> {
	response?: T
	error?: Error
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
			res.status(502).end(JSON.stringify({
				code: 502,
				url: req.url,
				msg: err
			}))
		}
	}
}

export const responseAuth = <T>(getResponse: (req: NextApiRequest, res: NextApiResponse, userId: string)
	=> Promise<Response<T>>)
	: (req: NextApiRequest, res: NextApiResponse) => Promise<void> => {
	return async (req, res) => {
		let userId: string = ''
		const base64Credentials = req.headers.authorization?.split(' ')[ 1 ];
		if (!req.headers.authorization || !base64Credentials
			|| req.headers.authorization.indexOf("Basic ") === -1) {
			res.status(401).end('Отсутсвует заголовок авторизации')
			return
		}
		try {

			const auth = FromBase64(base64Credentials)
			const id = auth.split(':')[ 0 ]
			const pass = auth.split(':')[ 1 ]
			const user = await prisma.user.findUnique({ where: { id: id } })
			if (!pass || !user) {
				res.status(401).end('Неверные данные авторизации')
				return
			}
			const checkPassword = await compare(pass, user.password ?? "")
			if (!checkPassword) {
				res.status(401).end('Неверный пароль')
				return
			}
			userId = user.id
		} catch {
			res.status(401).end('Неверные данные авторизации')
			return
		}

		try {
			const resp = await getResponse(req, res, userId)
			if (resp.error) {
				res.status(resp.error.code).json((resp.error))
				return
			}
			res.status(200).json(resp.response)
		} catch (err) {
			res.status(502).end(JSON.stringify({
				code: 502,
				url: req.url,
				msg: err
			}))
		}
	}
}

export const responseAdmin = <T>(getResponse: (req: NextApiRequest, res: NextApiResponse, userId: string)
	=> Promise<Response<T>>)
	: (req: NextApiRequest, res: NextApiResponse) => Promise<void> => {
	return async (req, res) => {
		let userId: string = ''
		const base64Credentials = req.headers.authorization?.split(' ')[ 1 ];
		if (!req.headers.authorization || !base64Credentials
			|| req.headers.authorization.indexOf("Basic ") === -1) {
			res.status(401).end('Отсутсвует заголовок авторизации')
			return
		}
		try {

			const auth = FromBase64(base64Credentials)
			const id = auth.split(':')[ 0 ]
			const pass = auth.split(':')[ 1 ]
			const user = await prisma.user.findUnique({
				where: { id: id },
				include: {
					scopes: {
						include: {
							scope: true
						}
					}
				}
			})
			if (!pass || !user) {
				res.status(401).end('Неверные данные авторизации')
				return
			}
			const checkPassword = await compare(pass, user.password ?? "")
			if (!checkPassword) {
				res.status(401).end('Неверный пароль')
				return
			}
			userId = user.id
			if (user?.scopes.find(p => p.scope.value != ScopeEnum.admin)) {
				res.status(403).end('Недостаточно прав пользователя')
				return
			}

		} catch {
			res.status(401).end('Неверные данные авторизации')
			return
		}

		try {
			const resp = await getResponse(req, res, userId)
			if (resp.error) {
				res.status(resp.error.code).json((resp.error))
				return
			}
			res.status(200).json(resp.response)
		} catch (err) {
			res.status(502).end(JSON.stringify({
				code: 502,
				url: req.url,
				msg: err
			}))
		}
	}
}
