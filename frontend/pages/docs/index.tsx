import { useCallback, useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatusPage from '@/components/StatusPage'
import { useSession } from '@/lib/session/hooks'
import styles from '@/styles/pages.module.scss'
type Manual = { id: number; name: string; html: string }

export default function Docs() {
 const session = useSession()
 const [ manuals, setManuals ] = useState<Manual[]>()
 const [ selected, setSelected ] = useState<number>()
 const [ error, setError ] = useState('')
 const signedIn = !!session && session !== 'loading'
 const load = useCallback(async () => {
  setError('')
  try {
   const response = await fetch('/api/studio/manuals')
   if (!response.ok) throw new Error(response.status === 403 ? 'Для чтения руководств требуется активный доступ к материалам.' : 'Не удалось загрузить руководства. Попробуйте ещё раз.')
   const data = await response.json()
   const items: Manual[] = data.manuals
   setManuals(items); setSelected(current => current ?? items[0]?.id)
  } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось загрузить руководства.') }
 }, [])
 useEffect(() => { if (signedIn) void load() }, [ signedIn, load ])
 if (session === null) return <StatusPage title="Руководства к занятиям"><p>Войдите в свою учётную запись, чтобы открыть методические материалы и инструкции Lab Studio.</p></StatusPage>
 const manual = manuals?.find(item => item.id === selected)
 return <Layout title="Руководства"><main className={styles.page}>
  <header className={styles.heading}><span className={styles.eyebrow}>Библиотека Lab Studio</span><h1>Руководства</h1><p>Методические материалы и инструкции для работы с заданиями.</p></header>
  {error ? <div className={styles.error} role="alert"><p>{error}</p><button className={styles.secondary} onClick={() => void load()}>Повторить</button></div>
   : !manuals ? <p role="status">Загружаем руководства…</p>
   : !manuals.length ? <div className={styles.card}><p>Руководства пока не опубликованы.</p></div>
   : <div className={styles.docLayout}>
    <label className={styles.docSelect}>Выберите руководство<select value={selected} onChange={event => setSelected(Number(event.target.value))}>{manuals.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <nav className={styles.docNav} aria-label="Список руководств">{manuals.map(item => <button key={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>{item.name}</button>)}</nav>
    <article className={styles.card} aria-label="Текст руководства"><h2>{manual?.name}</h2><div className={styles.manual} dangerouslySetInnerHTML={{ __html: manual?.html || '<p>Текст пока не добавлен.</p>' }} /></article>
   </div>}
 </main></Layout>
}
