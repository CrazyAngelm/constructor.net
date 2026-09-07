import { ReactNode } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Navbar from './Navbar'
import styles from '@/styles/Layout.module.scss'

export interface Props {
 children?: ReactNode
 title?: string
 navbar?: boolean
 footer?: boolean
}
export default function Layout({ children, title, navbar = true, footer = true }: Props) {
 return <div className={styles.root}>
  <Head><meta name="viewport" content="width=device-width, initial-scale=1" /><title>{title ? title + ' — Lab Studio' : 'Lab Studio'}</title><link rel="icon" href="/logo.png" /></Head>
  {navbar && <Navbar />}
  <div className={styles.content}>{children}</div>
  {footer && <footer className={styles.footer}>
   <span>Lab Studio · материалы для занятий</span>
   <a href="mailto:bestlaboratory@mail.ru">bestlaboratory@mail.ru</a>
   <Link href="/license">Лицензионное соглашение</Link>
  </footer>}
 </div>
}
