import NextAuth from 'next-auth'
import YandexProvider from 'next-auth/providers/yandex'
import CredentialsProvider from "next-auth/providers/credentials"
import { Session } from '@/lib/session'
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default NextAuth({
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				username: { label: "Username", type: "text", placeholder: "jsmith" },
				password: { label: "Password", type: "password" }
			},
			async authorize(credentials, req) {
				const res = await fetch("/your/endpoint", {
					method: 'POST',
					body: JSON.stringify(credentials),
					headers: { "Content-Type": "application/json" }
				})
				const user = await res.json()

				if (res.ok && user) {
					return user
				}
				return null
			}
		}),
		YandexProvider({
			clientId: '07c7c53baec648f7a76588fbea8d265a',
			clientSecret: 'd07ed54a3f3b41efadd05ca7baa6f4c6',
		}),
	],
	theme: {
		colorScheme: "light"
	},
	callbacks: {
		async session({ session, user, token }) {
			const _session = session as Session
			const scopes = await prisma.scopeJoin.findMany({
				where: {
					userId: user.id
				},
				include: {
					scope: true
				}
			})
			_session.scopes = scopes.map(p => p.scope.value)
			return _session
		}
	},
	adapter: PrismaAdapter(prisma)
})
