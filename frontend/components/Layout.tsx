import { ReactNode } from 'react'
import Image from 'next/image'

import styles from '@/styles/Layout.module.scss'

import logo from '@/assets/logo.png'
import Link from 'next/link'
import Head from 'next/head'
import Navbar from './Navbar'


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
			<Navbar />
			<article className={styles.content}>
				{children}
			</article>
		</div>
	)
}

export default Layout
