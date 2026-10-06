import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import styles from '@/styles/pages.module.scss'
type Access = { courses: Array<{ id: number; name: string }>; endDate?: string; name: string }
export default function PreviewAccess() {
 const [ access, setAccess ] = useState<Access>()
 const [ error, setError ] = useState('')
 const load = useCallback(async () => {
  setError('')
  try {
   const [ catalogResponse, subscriptionResponse ] = await Promise.all([ fetch('/api/studio/catalog'), fetch('/api/subscription/me') ])
   if (!catalogResponse.ok || !subscriptionResponse.ok) throw Error('Не удалось получить информацию о доступе.')
   const catalog = await catalogResponse.json()
   const subscription = await subscriptionResponse.json()
   setAccess({ courses: catalog.courses, endDate: subscription?.endDate, name: subscription?.license?.name === 'admin' ? 'Администратор' : 'Демонстрационный доступ' })
  } catch { setError('Не удалось загрузить доступные материалы. Проверьте соединение или обратитесь к администратору.') }
 }, [])
 useEffect(() => { void load() }, [ load ])
 return <section className={styles.card}><h2>Доступ к материалам</h2>
  <p className={styles.notice}>Демонстрационная версия работает отдельно от основного приложения. Платежи и автоматические списания здесь отключены.</p>
  {error ? <div role="alert"><p className={styles.error}>{error}</p><button className={styles.secondary} onClick={() => void load()}>Повторить</button></div> : !access ? <p role="status">Загружаем доступ…</p> : <>
   <h3 style={{ marginTop: 24, fontWeight: 600 }}>{access.name}</h3>
   {access.endDate && <p>Доступ до {new Date(access.endDate).toLocaleDateString('ru-RU')}</p>}
   {access.courses.length ? <ul>{access.courses.map(course => <li key={course.id}>{course.name}</li>)}</ul> : <p>Доступных курсов пока нет.</p>}
   <Link className={styles.primary} href="/studio">Перейти к материалам</Link>
  </>}
 </section>
}

