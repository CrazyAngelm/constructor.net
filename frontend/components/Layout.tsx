import { ReactNode } from 'react'
import Head from 'next/head'

import styles from '@/styles/Layout.module.scss'

import Navbar from './Navbar'
import logo from '@/assets/logo.png'
import Image from 'next/image'
import Script from 'next/script'


export interface Props {
	children?: ReactNode
	title?: string
	navbar?: boolean
	footer?: boolean
}
//Переделать на номральный навбар
const Layout = ({ children, title, navbar = true, footer = true }: Props) => {
	return (
		<div className={styles.root}>
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>Lab Studio{title && ` | ${title}`}</title>
				<link rel="shortcut icon" href="/favicon.png" />

			</Head>
			{navbar && <Navbar />}
			<article className={`${styles.content} ${navbar ?? styles.isNavbar}`}>
				{children}
			</article>
			{footer &&
				<footer className={styles.footer}>
					<section className={styles.info}>
						<header>
							<div>
								<Image src={logo} layout='fill' objectFit='contain' />
							</div>
							Lab Studio
						</header>
						<section>
							<header>Адресс</header>
							<div>city Nizhny novgorod</div>
							<div>bestlaboratory@mail.ru</div>
							<div>+7 922 333 4455</div>
						</section>
						<section>
							<header>Соц сети</header>
							<a>Telegramm</a>
							<a>Vk</a>
							<a>Instagramm</a>
						</section>
					</section>
					<section className={styles.other}>
						Любая доп инфа, если нужно, донат, обратная связь и тд
					</section>
				</footer>
			}
		</div>
	)
}

export default Layout
