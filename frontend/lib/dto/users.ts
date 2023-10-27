export const ScopeEnum = {
	admin: 'admin',
	editor: 'editor',
	developer: 'developer',

	Contains: (value: string, scopes?: string[]): boolean => {
		if (!scopes) return false
		if (scopes.indexOf(value) > -1) return true
		return false
	}
}

export interface UserDto {
	id: string
	name?: string
	email?: string
	image?: string
	scopes?: string[]
}

export interface UpdaetScopeDto{
	scope:string
	active:boolean
}

export interface SignUpDto{
	email:string,
	password:string,
}

export interface ResetPasswordDto {
	id: string,
	password: string,
	newPassword: string
}
