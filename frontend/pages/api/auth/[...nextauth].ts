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
			clientId: process.env.YANDEX_ID,
			clientSecret: process.env.YANDEX_SECRET,
		}),
	],
	theme: {
		colorScheme: "light"
	},
	callbacks: {
		async session({ session, user, token }) {
			const _session = session as Session
			_session.socpes = [ 'admin' ]
			return _session
		}
	},
	adapter: PrismaAdapter(prisma)
})
