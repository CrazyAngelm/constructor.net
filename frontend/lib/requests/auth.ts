import { Status } from "../dto/tasks"
import { ResetPasswordDto, SignUpDto, UserDto } from "../dto/users"
import { defaultRequestContext, handleNonOk, RequestContext } from "./shared"

export const signUp = async (
	dto: SignUpDto,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Status> => {
	const res = await fetch(apiUrl + `/auth/signup`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(dto),
	})

	await handleNonOk(res)

	return await res.json()
}

export const resendConfirmEmail = async (
	dto: SignUpDto,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Status> => {
	const res = await fetch(apiUrl + `/auth/resendConfirm`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(dto),
	})

	await handleNonOk(res)

	return await res.json()
}

export const sendResetPasssword = async (
	dto: SignUpDto,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Status> => {
	const res = await fetch(apiUrl + `/auth/sendResetPassword`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(dto),
	})

	await handleNonOk(res)

	return await res.json()
}
export const resetPassword = async (
	dto: ResetPasswordDto,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Status> => {
	const res = await fetch(apiUrl + `/auth/resetPassword`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(dto),
	})

	await handleNonOk(res)

	return await res.json()
}

export const confirmEmail = async (
	token: string,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Status> => {
	const res = await fetch(apiUrl + `/auth/confirmemail`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({token}),
	})

	await handleNonOk(res)

	return await res.json()
}
