import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next'
import { useEffect, useState } from 'react'
import { ParsedUrlQuery } from 'querystring'
import { confirmEmail } from '@/lib/requests/auth'
import { ApiError } from '@/lib/requests'
import { useRouter } from 'next/router'
import { signIn } from 'next-auth/react'

interface Props {
	token: string
}

interface Token {
	id?: string,
	email?: string,
	pass?: string
}

const ConfirmEmail: NextPage<Props> = ({ token }: Props) => {
	const [ status, setStatus ] = useState('Loading...')
	const [ error, setError ] = useState<string>()

	const router  = useRouter()

	useEffect(() => {
		if(!router) return
		console.log(token)
		confirmEmail(token).then(async (p) =>  {
			setStatus(`${p.status}. Redirect...`)
			//Toodoo защитить пароль вход через бэкенд
			const tok = JSON.parse(Buffer.from(token, 'base64').toString('binary')) as Token
			const status = await signIn('credentials', {
				redirect: true,
				callbackUrl: '/',
				email: tok.email,
				password: tok.pass,
			}) as any as {error:string}

			if (status.error) {
				setError(status.error)
				return
			}
		}).catch((err) => {
			if(err instanceof ApiError) setError(err.message)
			console.log(err)
		})
	}, [ router ])

	return (
		<article>
			{error ?? status}
		</article>
	)
}

interface QueryWithToken extends ParsedUrlQuery {
	token: string | undefined
}

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
	const { token } = context.query as QueryWithToken

	if (!token) return { notFound: true }

	return {
		props: {
			token,
		},
	}
}

export default ConfirmEmail
