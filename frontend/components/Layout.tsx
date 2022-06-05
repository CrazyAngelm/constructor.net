import { ReactNode } from 'react'
import Image from 'next/image'

import styles from '@/styles/Layout.module.scss'

import logo from '@/assets/logo.png'
import Link from 'next/link'
import Head from 'next/head'


export interface Props {
	children?: ReactNode
	title?: string
}
//Переделать на номральный навбар
const Layout = ({ children, title }: Props) => {
	return (
		<div className={styles.root}>
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>Neurography{title && ` | ${title}`}</title>
			</Head>
			<nav>
				<Link href={'/'}>
					<section className={styles.about}>
						<div>
							<Image src={logo} layout='fill' objectFit='contain' />
						</div>
						<span>Neurography</span>
					</section>
				</Link>
			</nav>
			{children}
		</div>
	)
}

export default Layout
