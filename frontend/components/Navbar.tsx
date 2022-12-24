import Link from 'next/link'
import Image from 'next/image'

import styles from '@/styles/Navbar.module.scss'

import logo from '@/assets/logo.png'
import { useSession } from '@/lib/session/hooks'
import { signOut } from 'next-auth/react'
import Auth from './auth/Auth'


const Navbar = () => {
	const session = useSession()

	return (
		<nav className={`${styles.navbar} ${styles.fixed}`} role="navigation" aria-label="main navigation">
			<section className={styles.brand}>
				<div>
					<Link href={'/'}>
						<section className={styles.about}>
							<div>
								<Image src={logo} layout='fill' objectFit='contain' />
							</div>
							<span>Lab Studio</span>
						</section>
					</Link>
				</div>
			</section>

			<section className={styles.menu} >
				<section className={styles.start}>
					<Link href={'/'}>О нас</Link>
					<Link href={'/'}>Как работает?</Link>
					<Link href={'/'}>Купить</Link>
					<Link href={'/'}>Отзывы</Link>
					<Link href={'/'}>FAQ</Link>
				</section>

				<section className={styles.end}>
					{!(session && session != 'loading')
						? <div>
							<div className={styles.buttons}>
								<Auth button={
									<button className={`${styles.log} ${styles.button}`}>
										Войти
									</button>
								} />
							</div>
						</div>
						: <section className={styles.lkNavbar}>
							<div className={styles.lk}>
								<span>{session.user?.name ? session.user.name : 'unknow'}</span>
								{session.user?.image
									? <img src={session.user?.image} className={styles.rounded} />
									: <div className={styles.avatar}>
										<span>
											{session.user?.name ? session.user.name[ 0 ] : 'U'}
										</span>
									</div>
								}
							</div>
							<section className={styles.avatarMenu}>
								{/* <Link href={"/lk"}>Личный кабинет</Link> */}
								<hr></hr>
								<a onClick={() => signOut()} className={styles.exit}>Выход</a>
							</section>
						</section>
					}
				</section>
			</section>
		</nav>
	)
}

export default Navbar
