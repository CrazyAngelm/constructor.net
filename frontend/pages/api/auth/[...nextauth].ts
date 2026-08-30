import NextAuth from 'next-auth'
import YandexProvider from 'next-auth/providers/yandex'
import CredentialsProvider from 'next-auth/providers/credentials'
import { Session } from '@/lib/session'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { getPrisma } from '@/lib/api/database'
import { compare } from 'bcryptjs'
import { UserDto } from '@/lib/dto/users'
import { ConfirmEmailError } from '@/lib/api/error'
const prisma = getPrisma()
const yandexClientId = process.env.YANDEX_CLIENT_ID
const yandexClientSecret = process.env.YANDEX_CLIENT_SECRET
export default NextAuth({
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				email: { label: 'Email', type: 'text', placeholder: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials, req) {
				if (!credentials?.email || !credentials.password) throw new Error('Invalid credentials')
				const user = await prisma.user.findUnique({
					where:{email:credentials.email},
				})
				if (!user) throw new Error('Invalid credentials')
				const checkPassword = await compare(credentials.password, user.password ?? '')
				if (!checkPassword) throw new Error('Invalid credentials')
				if (!user.emailVerified) throw ConfirmEmailError
				return {id:user.id}
			},
		}),
		...(yandexClientId && yandexClientSecret ? [YandexProvider({
			clientId: yandexClientId,
			clientSecret: yandexClientSecret,
		})] : []),
	],
	theme: {
		colorScheme: 'light',
	},
	session:{
		strategy:'jwt',
	},
	secret:process.env.NEXTAUTH_SECRET,
	callbacks: {
		async session({ session, token }) {
			const _session = session as Session
			const user = await prisma.user.findUnique({
				where: {
					id: token.sub,
				},
			}) as UserDto
			if (!user) throw new Error('User not found')
			user.scopes = (await prisma.scopeJoin.findMany({
				where: { userId: user.id },
				include: { scope: true },
			})).map(p => p.scope.value)
			_session.user = user as UserDto
			_session.scopes = user.scopes
			_session.address = token.sub
			return _session
		},
	},
	adapter: PrismaAdapter(prisma),
})
