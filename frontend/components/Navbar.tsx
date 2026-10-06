import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { signOut } from 'next-auth/react'
import { useSession } from '@/lib/session/hooks'
import styles from '@/styles/Navbar.module.scss'

export default function Navbar() {
 const session = useSession()
 const router = useRouter()
 const signedIn = session && session !== 'loading'
 return <header className={styles.header}>
  <Link href="/" className={styles.brand} aria-label="Lab Studio — на главную"><Image src="/logo.png" width={36} height={36} alt="" /><span>Lab Studio</span></Link>
  <nav className={styles.nav} aria-label="Основная навигация">
   {[ [ '/studio', 'Конструктор' ], [ '/docs', 'Руководства' ], ...(signedIn ? [ [ '/lk', 'Личный кабинет' ] ] : []) ].map(([ href, label ]) =>
    <Link key={href} href={href!} aria-current={router.pathname === href ? 'page' : undefined}>{label}</Link>)}
  </nav>
  {signedIn ? <button className={styles.action} onClick={() => void signOut({ callbackUrl: '/studio/auth' })}>Выйти</button> : <Link className={styles.action} href="/studio/auth">Войти</Link>}
 </header>
}
