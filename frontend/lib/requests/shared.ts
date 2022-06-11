export interface RequestContext {
	apiUrl: string
}

export const defaultRequestContext: RequestContext = {
	apiUrl: '/api/',
}

export type Request<Key, Return> = (key: Key) => Promise<Return>
export type RequestWithContext<Key, Return> = (key: Key, ctx: RequestContext) => Promise<Return>

export const applyRequestContext = <Key, Return>(
	ctx: RequestContext,
	req: RequestWithContext<Key, Return>,
): Request<Key, Return> => {
	return (key: Key): Promise<Return> => {
		return req(key, ctx)
	}
}

export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
	) {
		super(message)

		Object.setPrototypeOf(this, ApiError.prototype)
	}
}

export const handleNonOk = async (res: Response) => {
	if (res.ok) return true

	const contentType = res.headers.get('content-type')
	const isJson = contentType && ~contentType.indexOf('application/json')

	const message = isJson && (await res.json()).message
		|| (res.status < 500 ? res.statusText : 'Ошибка сервера')

	throw new ApiError(res.status, message)
}

export const handleErrorTsx = (err: unknown, setError: ((msg: string) => void)) => {
	console.log(err)
	if (err instanceof ApiError) setError(err.message)
	else setError(JSON.stringify(err))
}
