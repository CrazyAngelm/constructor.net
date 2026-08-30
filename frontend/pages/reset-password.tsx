import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next'
import { useState } from 'react'
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
import Router from 'next/router'

interface Props {
	token: string
}

const ResetPassword: NextPage<Props> = ({ token }: Props) => {
	const [ error, setError ] = useState<string>()
	const [ signupDto, setSignupDto ] = useState<SignUpDto>()
	const [ confirmPassword, setConfirmPassword ] = useState<string>()

	const onClose = () => {
		Router.push('/')
	}

	const reset = async () => {
		if(!signupDto || signupDto?.password !== confirmPassword) {
			setError('Данные в полях "пароль" и "повторите пароль" не совпадают')
			return
		}
		try {
			await makeFetcher(resetPassword)({ token, newPassword: signupDto.password })
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
									<Image src={close} alt="" layout="fill" objectFit="contain" />
								</div>
							</section>
							<section className={styles.content}>
								<header>Сброс пароля</header>
									Введите ниже новый пароль.
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
