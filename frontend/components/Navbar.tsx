import Link from 'next/link'
import Image from 'next/image'

import styles from '@/styles/Navbar.module.scss'

import logo from '@/assets/logo-text.svg'
import { useSession } from '@/lib/session/hooks'
import { signOut } from 'next-auth/react'
import Auth from './auth/Auth'
import { useState } from 'react'


const Navbar = () => {
	const session = useSession()
	const [ isOpenAvatarMenu, setOpenAvatarMenu ] = useState(false)

	return (
		<nav className={`${styles.navbar} ${styles.fixed}`} role="navigation" aria-label="main navigation">
			<section className={styles.brand}>
				<div>
					<Link href={'/'}>
						<section className={styles.about}>
							<div>
								<Image src={logo} alt="" layout="fill" objectFit="contain" />
							</div>
							{/* <span>Lab Studio</span> */}
						</section>
					</Link>
				</div>
			</section>

			<section className={styles.menu} >
				<section className={styles.start}>
					<Link href={'/#about'}>О нас</Link>
					<Link href={'/#pricing'}>Купить</Link>
					<Link href={'/#comments'}>Отзывы</Link>
					<Link href={'/#faq'}>FAQ</Link>
					<Link href={'/docs'}>Документация</Link>
				</section>

				<section className={styles.end}>
					{!(session && session !== 'loading')
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
							<div className={styles.lk} onClick={() => setOpenAvatarMenu(p => !p)}>
								{session.user?.image
									? <img src={session.user?.image} className={styles.rounded} />
									: <div className={styles.avatar}>
										<span>
											{session.user?.name ? session.user.name[0] : 'U'}
										</span>
									</div>
								}
								<span>{session.user?.name ? session.user.name : 'unknow'}</span>
							</div>
							<section className={`${styles.avatarMenu} ${isOpenAvatarMenu ? styles.open : ''}`}>
								<Link href={'/lk'}>Личный кабинет</Link>
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
