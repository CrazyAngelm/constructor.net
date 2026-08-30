import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next'
import { useEffect, useState } from 'react'
import { ParsedUrlQuery } from 'querystring'
import { confirmEmail } from '@/lib/requests/auth'
import { ApiError } from '@/lib/requests'

interface Props {
	token: string
}

const ConfirmEmail: NextPage<Props> = ({ token }: Props) => {
	const [ status, setStatus ] = useState('Loading...')
	const [ error, setError ] = useState<string>()

	useEffect(() => {
		confirmEmail(token).then((p) =>  {
			setStatus(p.status)
		}).catch((err) => {
			if(err instanceof ApiError) setError(err.message)
			console.log(err)
		})
	}, [ token ])

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
