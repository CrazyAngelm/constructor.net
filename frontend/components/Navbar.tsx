import Link from 'next/link'
import Image from 'next/image'

import styles from '@/styles/Navbar.module.scss'

import logo from '@/assets/logo.png'


const Navbar = () => {
	return (
		<nav className={`${styles.navbar} ${styles.fixed}`} role="navigation" aria-label="main navigation">
			<section className={styles.brand}>
				<div>
					<Link href={'/'}>
						<section className={styles.about}>
							<div>
								<Image src={logo} layout='fill' objectFit='contain' />
							</div>
							<span>Neurography</span>
						</section>
					</Link>
				</div>
			</section>

			<section className={styles.menu} >
				<section className={styles.start}>
					<Link href={'/'}>Home</Link>
					<Link href={'/'}>О нас</Link>
				</section>

				<section className={styles.end}>
					<div>
						<div className={styles.buttons}>
							<Link href={'/auth'}>
								<button className={`${styles.sign} ${styles.button}`}>
									Регистрация
								</button>
							</Link>
							<Link href={'/auth'}>
								<button className={`${styles.log} ${styles.button}`}>
									Войти
								</button>
							</Link>
						</div>
					</div>
				</section>
			</section>
		</nav>
	)
}

export default Navbar
