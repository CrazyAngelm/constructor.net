export interface User {
	id: string,
	name?: string
	email?: string
	emailVerified?: Date
	image?: string
	accounts: Account[]
	sessions: Session[]
	scopes: ScopeJoin[]
}

export interface Session {
	id: string
	sessionToken: string
	userId: string
	expires: Date
	user: User
}

export interface Account {
	id: string
	userId: string
	type: string
	provider: string
	providerAccountId: string
	refresh_token?: string
	access_token?: string
	expires_at?: number
	token_type?: string
	scope?: string
	id_token?: string
	session_state?: string
	user: User
}

export interface VerificationToken {
	identifier: string
	token: string
	expires: Date
}

export interface Scope {
	id: number
	value: string
	scopeJoins: ScopeJoin[]
}

export interface ScopeJoin {
	id: number
	userId: string
	scopeId: number
	scope: Scope
	user: User
}
