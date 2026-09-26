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
   <a href="tel:+79229801477">+7 922 980-14-77 — администраторы</a>
   <a href="https://t.me/labstudio_support_bot" target="_blank" rel="noreferrer">Написать в поддержку</a>
   <Link href="/license">Лицензионное соглашение</Link>
   <span>ИП Калашникова Виктория Владимировна · ОГРНИП 319435000027099 · ИНН 434510331832</span>
  </footer>}
 </div>
}
