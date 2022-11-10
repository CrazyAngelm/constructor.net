
import { Version } from '../dto/versions'
import { RequestWithContext, RequestContext, defaultRequestContext, handleNonOk } from './shared'

export const getVersions: RequestWithContext<unknown, Version[]> = async (
	_?: unknown,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Version[]> => {
	const res = await fetch(apiUrl + '/versions/all')
	handleNonOk(res)
	const json = await res.json()

	return json
}

export const getVersionById: RequestWithContext<string, Version> = async (
	id: string,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Version> => {
	const res = await fetch(apiUrl + '/versions/' + encodeURIComponent(id))

	await handleNonOk(res)

	const json = await res.json()

	return json
}

export const updateVersion = async (
	id: string,
	dto: Version,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Version> => {
	const res = await fetch(apiUrl + `/versions/${encodeURIComponent(id)}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(dto),
	})

	await handleNonOk(res)

	return await res.json()
}

