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
				<title>Neurography{title && ` | ${title}`}</title>
			</Head>
			{navbar && <Navbar />}
			<article className={`${styles.content} ${styles.isNavbar}`}>
				{children}
			</article>
		</div>
	)
}

export default Layout
