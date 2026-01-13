import { CreateManual, Manual } from '../dto/manuals'
import { defaultRequestContext, handleNonOk, RequestContext, RequestWithContext } from './shared'

export const getAllManuals: RequestWithContext<unknown, Manual[]> = async (
	_?: unknown,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Manual[]> => {
	const res = await fetch(apiUrl + 'manuals')
	handleNonOk(res)
	const json = await res.json()

	return json
}

export const getManuals: RequestWithContext<number | undefined, Manual[]> = async (
	id?: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Manual[]> => {
	const res = await fetch(apiUrl + 'manuals/' + encodeURIComponent(id ? id : -1)+'/manuals/')
	handleNonOk(res)
	const json = await res.json()

	return json
}

export const getManualById: RequestWithContext<number, Manual> = async (
	id: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Manual> => {
	const res = await fetch(apiUrl + '/manuals/' + encodeURIComponent(id))

	await handleNonOk(res)

	const json = await res.json()

	return json
}

export const updateManual = async (
	id: number,
	dto: Manual,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Manual> => {
	const res = await fetch(apiUrl + `/manuals/${encodeURIComponent(id)}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(dto),
	})

	await handleNonOk(res)

	return await res.json()
}

export const createManual = async (
	dto: CreateManual,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Manual> => {
	const res = await fetch(apiUrl + '/manuals/create', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(dto),
	})

	await handleNonOk(res)

	return await res.json()
}

export const removeManual = async (
	id: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Record<string, unknown>> => {
	const res = await fetch(apiUrl + `/manuals/${encodeURIComponent(id)}`, {
		method: 'PUT',
	})

	await handleNonOk(res)

	return await res.json()
}
