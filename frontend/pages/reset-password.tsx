import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next'
import { useEffect, useState } from 'react'
import { ParsedUrlQuery } from 'querystring'
import Layout from '@/components/Layout'
import TittlePanel from '@/components/home/TittlePanel'
import About from '@/components/home/About'
import FAQ from '@/components/home/FAQ'
import Tarifs from '@/components/home/Tarifs'
import stylesIndex from '@/styles/home/Index.module.scss'
import styles from '@/styles/auth/Auth.module.scss'
import Image from 'next/image'
import close from '@/assets/close.svg'
import { onChangeDto } from '@/lib/changeHandler'
import { SignUpDto } from '@/lib/dto/users'
import { makeFetcher } from '@/lib/fetchers'
import { resetPassword } from '@/lib/requests/auth'
import { ApiError } from '@/lib/requests'
import Router, { useRouter } from 'next/router'

interface Props {
	token: string
}

interface Token {
	id?: string,
	email?: string,
	pass?: string
}

const ResetPassword: NextPage<Props> = ({ token }: Props) => {
	const [ gloabalError, setGloabalError ] = useState<string>()
	const [ error, setError ] = useState<string>()
	const [ user, setUser ] = useState<Token>()
	const [ signupDto, setSignupDto ] = useState<SignUpDto>()
	const [ confirmPassword, setConfirmPassword ] = useState<string>()


	useEffect(() => {
		try {
			setUser(JSON.parse(Buffer.from(token, 'base64').toString('binary')) as Token)
		} catch (err) {
			setGloabalError('Неверный токен')
		}
	}, [])

	const onClose = () => {
		Router.push('/')
	}

	const reset = async () => {
		if(!user?.id || !user.pass) {
			setError('Неверный токен')
			return
		}
		if(!signupDto || signupDto?.password !== confirmPassword) {
			setError('Данные в полях "пароль" и "повторите пароль" не совпадают')
			return
		}
		try {
			const res = await makeFetcher(resetPassword)({id: user.id, password: user.pass, newPassword: signupDto.password})
			Router.push('/')
		} catch (err) {
			if(err instanceof ApiError) setError(err.message)
			console.log(err)
		}
	}

	return (
		<Layout>
			<div className={stylesIndex.index}>
				<TittlePanel />
				<About />
				<Tarifs />
				<br />
				<br />
				<FAQ />
				<article className={styles.auth}>
					<article className={styles.modal}>
						<section className={styles.body}>
							<section className={styles.close}>
								<div onClick={onClose}>
									<Image src={close} layout="fill" objectFit="contain" />
								</div>
							</section>
							<section className={styles.content}>
								<header>Сброс пароля</header>
								{gloabalError ? <div className={styles.error}>{error}</div>
									: <>
										Сброс пароля для пользователя {user?.email}. Введите ниже новый пароль.
										<input type={'password'} placeholder="ПАРОЛЬ"
											value={signupDto?.password}
											onChange={onChangeDto('password', setSignupDto)} />
										<input type={'password'} placeholder="ПОВТОРИТЕ ПАРОЛЬ"
											value={confirmPassword}
											onChange={v => setConfirmPassword(v.target.value)} />
										<section className={styles.buttons}>
											<button onClick={reset} className={styles.primary}>Подтвердить</button>
											<button onClick={onClose} className={styles.secondary}>Отмена</button>
										</section>
										{error && <section>{error}</section>}
									</>}
							</section>
						</section>
					</article>
				</article>
			</div>
		</Layout >
	)
}

interface QueryWithToken extends ParsedUrlQuery {
	token: string | undefined
}

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
	const { token } = context.query as QueryWithToken

	if (!token) return { notFound: true }

	return {
		props: {
			token,
		},
	}
}

export default ResetPassword
