import { NextPage } from 'next'
import styles from '@/styles/auth/index.module.scss'
import Layout from '@/components/Layout'
import { signIn } from 'next-auth/react'
import { useSession } from '@/lib/session/hooks'

const Auth: NextPage = () => {
	const session = useSession()

	return (
		<Layout title='Auth'>
			{session === null
				? <article className={styles.auth}>
					<section>
						<div>
							<label>Name</label>
							<div>
								<input type="text" placeholder="username" />
							</div>
						</div>
						<div>
							<label>Password</label>
							<div>
								<input type="password" placeholder="password" />
							</div>
						</div>
						<button onClick={() => signIn()}>Войти</button>
						<hr />
						<button onClick={() => signIn('yandex',{callbackUrl:'/'})} className={`${styles.button} ${styles.primary}`}>
							Войти с помощью Yandex
						</button>
					</section>
				</article>
				: <article className={styles.auth} >
					<div className={styles.notification}>
						Вы уже аутентифицировались
						<section>
							<button>На главную</button>
						</section>
					</div>
				</article>
			}
		</Layout>
	)
}

export default Auth
