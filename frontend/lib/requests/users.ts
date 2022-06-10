import { UpdaetScopeDto, UserDto } from '@/lib/dto/users';

import { RequestWithContext, RequestContext, defaultRequestContext, handleNonOk } from './shared'

export const getUsers: RequestWithContext<unknown, UserDto[]> = async (
	_?: unknown,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<UserDto[]> => {
	const res = await fetch(apiUrl + '/users')
	handleNonOk(res)
	const json = await res.json()

	return json
}

export const getUserById: RequestWithContext<string, UserDto> = async (
	id: string,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<UserDto> => {
	const res = await fetch(apiUrl + '/users/' + encodeURIComponent(id))

	await handleNonOk(res)

	const json = await res.json()

	return json
}

export const updateUser = async (
	id: string,
	dto: UserDto,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<UserDto> => {
	const res = await fetch(apiUrl + `/users/${encodeURIComponent(id)}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(dto),
	})

	await handleNonOk(res)

	return await res.json()
}


export const updateScope = async (
	id: string,
	dto: UpdaetScopeDto,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<UpdaetScopeDto> => {
	const res = await fetch(apiUrl + `/users/${encodeURIComponent(id)}/scope`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(dto),
	})

	await handleNonOk(res)

	return await res.json()
}
