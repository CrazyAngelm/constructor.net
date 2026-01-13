import { DefaultSession } from 'next-auth'
import { UserDto } from '../dto/users'

export interface Session extends DefaultSession {
	scopes: string[]
	address?: string
	user? :UserDto
}
