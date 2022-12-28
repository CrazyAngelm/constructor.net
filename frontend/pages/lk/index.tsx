import { NextPage } from 'next'
import { ParsedUrlQuery } from 'querystring'
import { withSession } from '@/lib/session/withSession'
import Layout from '@/components/Layout'
import { UserDto } from '@/lib/dto/users'

import styles from '@/styles/lk/index.module.scss'
import { useSession } from '@/lib/session/hooks'
import Router, { useRouter } from 'next/router'
import { signOut } from 'next-auth/react'
import { ReactNode, useState } from 'react'
import Account from '@/components/lk/Account'
import Subscription from '@/components/lk/Subscription'

interface Props {
	user: UserDto
}

interface NavigationPage {
	label:string
	hash:string,
	node:ReactNode
}

const navigation = [
	{
		label: 'Личные данные',
		hash:'account',
		node: <Account />
	},
	{
		label: 'Подписки',
		hash:'subscription',
		node:<Subscription />
	}
] as NavigationPage[]

const Lk: NextPage<Props> = ({ user }: Props) => {
	const session = useSession()
	const router = useRouter()
	const [page, setPage] = useState<NavigationPage>()

	/* if(window && page?.hash !== window.location.hash){
		setPage(navigation.find(p => p.hash == window.location.hash))
	} */

	const nav = (page:NavigationPage) => () => {
		console.log(page)
		window.location.hash = page.hash
		setPage(page)
	}

	if (session === 'loading') return <article className={styles.loading}>Loading...</article>

	if (!session) {
		Router.push("/")
		return null;
	}

	return (
		<Layout title='Lk' navbar={false} footer={false}>
			<article className={styles.lk}>
				<nav>
					<section className={styles.info}>
						<section className={styles.avatar}>
							<span>{session.user?.name ? session.user.name[ 0 ] : 'unknow'}</span>
						</section>
						<p>{session.user?.name}</p>
					</section>
					<hr />
					<section className={styles.items}>
						{
							navigation.map(p =>
								<a key={p.hash}
								className={p.hash == page?.hash ? styles.active:''}
								onClick={nav(p)}>{p.label}</a>)
						}
						<hr />
						<a onClick={() => signOut()} className={styles.danger}>Выход</a>
					</section>
				</nav>
				<section>
					{page?.node}
				</section>
			</article>
		</Layout>
	)
}

interface QueryWithToken extends ParsedUrlQuery {
	token: string | undefined
}

export const getServerSideProps = withSession((session, context) => {
	return {
		props: {
			user: session.user
		}
	}
})

export default Lk
