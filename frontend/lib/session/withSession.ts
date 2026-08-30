import { GetServerSidePropsContext } from 'next'
import { getSession as getSessionReact, GetSessionParams } from 'next-auth/react'
import { Session } from '.'

const REDIRECT_UNAUTORIZE = '/studio/auth'
const REDIRECT_ACCES_DENIED = '/'

export const getSession = async (params?: GetSessionParams | undefined)
	: Promise<Session | null> => {
	const session = (await getSessionReact(params)) as (Session | null)
	return session
}

export const withSession = <T>(
	target: (session: Session, context: GetServerSidePropsContext) => Promise<T> | T
) => {
	return async (context: GetServerSidePropsContext) => {
		const session = await getSession(context)
		if (!session) return {
			redirect: {
				destination: REDIRECT_UNAUTORIZE ?? '/',
				permanent: false,
			},
		}

		return target(session, context)
	}
}

export const withAdminSession = <T>(
	target: (session: Session, context: GetServerSidePropsContext) => Promise<T> | T
) => {
	return withSession((session, context) => {
		if (session.scopes.indexOf('admin') === -1) return {
			redirect: {
				destination: REDIRECT_ACCES_DENIED ?? '/',
				permanent: false,
			},
		}

		return target(session, context)
	})
}
