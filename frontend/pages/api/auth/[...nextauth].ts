import NextAuth from 'next-auth'
import YandexProvider from 'next-auth/providers/yandex'
import CredentialsProvider from "next-auth/providers/credentials"
import { Session } from '@/lib/session'
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { usePrisma } from '@/lib/api/database'
import { compare } from 'bcryptjs'
import { UserDto } from '@/lib/dto/users'

const prisma = new PrismaClient()

export default NextAuth({
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				email: { label: "Email", type: "text", placeholder: "email" },
				password: { label: "Password", type: "password" }
			},
			async authorize(credentials, req) {

				if (!credentials) throw new Error("credentials is null")
				const prisma  = usePrisma()

				const user = await prisma.user.findUnique({
					where:{email:credentials.email}
				})

				if (!user) throw new Error("No user found with the email")

				const checkPassword = await compare(credentials.password, user.password ?? "")

				if (!checkPassword) throw new Error("Ivalid password")

				if(!user.emailVerified) throw new Error("Email не подтвержден")

				return {id:user.id}
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
	session:{
		strategy:'jwt'
	},
	secret:process.env.NEXTAUTH_SECRET,
	callbacks: {
		async session({ session, token }) {
			const _session = session as Session
			const user = await prisma.user.findUnique({
				where: {
					id: token.sub
				}
			}) as UserDto


			if (!user) throw new Error("User not found")

			user.scopes = (await prisma.scopeJoin.findMany({
				where: { userId: user.id },
				include: { scope: true }
			})).map(p => p.scope.value)

			_session.user = user as UserDto
			_session.scopes = user.scopes
			_session.address = token.sub
			return _session
		}
	},
	adapter: PrismaAdapter(prisma)
})
