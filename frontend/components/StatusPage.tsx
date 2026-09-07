import { ReactNode } from 'react'
import Link from 'next/link'
import Layout from './Layout'
import styles from '@/styles/pages.module.scss'

export default function StatusPage({ title, children, href = '/studio/auth', action = 'Перейти ко входу' }: { title: string; children: ReactNode; href?: string; action?: string }) {
 return <Layout title={title}><main className={styles.status}>
  <span className={styles.eyebrow}>Lab Studio</span><h1>{title}</h1>
  <div className={styles.prose}>{children}</div>
  <Link className={styles.primary} href={href}>{action}</Link>
 </main></Layout>
}

