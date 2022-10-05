import { ReactNode } from 'react'
import Head from 'next/head'

import styles from '@/styles/Layout.module.scss'

import Navbar from './Navbar'


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
			</Head>
			{navbar && <Navbar />}
			<article className={`${styles.content} ${navbar ?? styles.isNavbar}`}>
				{children}
			</article>
		</div>
	)
}

export default Layout
