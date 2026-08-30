import { FormEvent, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'

import Layout from '@/components/Layout'
import { useSession } from '@/lib/session/hooks'
import styles from '@/styles/studioAuth.module.scss'

const StudioAuthPage = () => {
	const router = useRouter()
	const session = useSession()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		if (session && session !== 'loading') void router.replace('/studio')
	}, [ router, session ])

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError('')
		setSubmitting(true)
		try {
			const result = await signIn('credentials', { redirect: false, email, password })
			if (!result?.ok) {
				setError('Не удалось войти. Проверьте email и пароль.')
				return
			}
			await router.replace('/studio')
		} catch {
			setError('Сервис входа временно недоступен. Повторите попытку.')
		} finally {
			setSubmitting(false)
		}
	}

	return <Layout title="Вход в веб-версию" navbar={false} footer={false}>
		<main className={styles.page}>
			<Link className={styles.brand} href="/" aria-label="Lab Studio — на главную">
				<Image src="/logo.png" width={36} height={36} alt="" priority />
				<span>Lab Studio</span>
			</Link>
			<section className={styles.intro}>
				<p>Веб-версия Lab Studio</p>
				<h1>Продолжите работу с материалами в браузере.</h1>
				<span>Текущая версия приложения продолжает работать параллельно.</span>
			</section>
			<form className={styles.card} onSubmit={submit}>
				<div>
					<span className={styles.kicker}>Личный кабинет</span>
					<h2>Войти</h2>
					<p>Используйте существующую или выданную для просмотра учётную запись.</p>
				</div>
				<label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
				<label>Пароль<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
				{error && <p className={styles.error} role="alert">{error}</p>}
				<button type="submit" disabled={submitting}>{submitting ? 'Входим…' : 'Войти в веб-версию'}</button>
				<Link className={styles.back} href="/">Вернуться на главную</Link>
			</form>
		</main>
	</Layout>
}

export default StudioAuthPage
