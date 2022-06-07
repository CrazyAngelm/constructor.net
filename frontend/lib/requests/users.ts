import { UserDto } from '@/lib/dto/users';

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
