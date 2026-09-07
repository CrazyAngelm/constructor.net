import Link from 'next/link'
import { useEffect, useState } from 'react'
import { withSession } from '@/lib/session/withSession'
import { previewExternalFlowsRestricted } from '@/lib/preview'
import { useSession } from '@/lib/session/hooks'
import Layout from '@/components/Layout'
import Subscriptions from '@/components/lk/Subscription'
import PreviewAccess from '@/components/lk/PreviewAccess'
import styles from '@/styles/pages.module.scss'

export default function AccountPage({ preview }: { preview: boolean }) {
 const session = useSession()
 const [ tab, setTab ] = useState('account')
 useEffect(() => {
  const sync = () => setTab(location.hash === '#subscription' ? 'subscription' : 'account')
  sync(); window.addEventListener('hashchange', sync)
  return () => window.removeEventListener('hashchange', sync)
 }, [])
 return <Layout title="Личный кабинет"><main className={styles.page}>
  <header className={styles.heading}><span className={styles.eyebrow}>Ваша учётная запись</span><h1>Личный кабинет</h1><p>Профиль и доступ к материалам Lab Studio.</p></header>
  <nav className={styles.tabs} aria-label="Разделы кабинета"><a href="#account" aria-current={tab === 'account' ? 'page' : undefined}>Личные данные</a><a href="#subscription" aria-current={tab === 'subscription' ? 'page' : undefined}>Подписки</a></nav>
  {tab === 'account' ? <section className={styles.card}><h2>Личные данные</h2>
   {session && session !== 'loading' ? <><dl className={styles.details}>
    <dt>Имя</dt><dd>{session.user?.name || 'Не указано'}</dd>
    <dt>Email</dt><dd>{session.user?.email}</dd>
    <dt>Тип доступа</dt><dd>{session.scopes.includes('admin') ? 'Администратор' : 'Пользователь'}</dd>
   </dl><Link className={styles.primary} href="/studio">Открыть конструктор</Link>
   {session.scopes.includes('admin') && <p><Link className={styles.secondary} href="/adm">Панель администрирования</Link></p>}</> : <p role="status">Загружаем профиль…</p>}
  </section> : preview ? <PreviewAccess /> : <section className={styles.card}><h2>Подписки</h2><Subscriptions /></section>}
 </main></Layout>
}
export const getServerSideProps = withSession(() => ({ props: { preview: previewExternalFlowsRestricted() } }))
