import { ReactNode } from 'react'
import Head from 'next/head'

import styles from '@/styles/Layout.module.scss'

import Navbar from './Navbar'
import logo from '@/assets/logo.png'
import Image from 'next/image'


export interface Props {
	children?: ReactNode
	title?: string
	navbar?: boolean
}
//Переделать на номральный навбар
const Layout = ({ children, title, navbar = true }: Props) => {
	return (
		<div className={styles.root}>
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>Lab Studio{title && ` | ${title}`}</title>
				<link rel="shortcut icon" href="/favicon.png" />
				<script src="https://yookassa.ru/checkout-widget/v1/checkout-widget.js"></script>
			</Head>
			{navbar && <Navbar />}
			<article className={`${styles.content} ${navbar ?? styles.isNavbar}`}>
				{children}
			</article>
			<section className={styles.footer}>
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
			</section>
		</div>
	)
}

export default Layout
