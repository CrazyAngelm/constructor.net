/* eslint-disable react/no-unescaped-entities -- legacy localized copy */
import { useState } from 'react'
import Image from 'next/image'

import { signIn, SignInResponse } from 'next-auth/react'

import styles from '@/styles/auth/Auth.module.scss'

import { onChangeDto } from '@/lib/changeHandler'
import { SignUpDto } from '@/lib/dto/users'
import { ApiError } from '@/lib/requests'
import { ConfirmEmailError } from '@/lib/api/error'
import { makeFetcher } from '@/lib/fetchers'
import { resendConfirmEmail, sendResetPasssword } from '@/lib/requests/auth'
import close from '@/assets/close.svg'

export interface Props {
	onSucess?: () => void,
	onError?: (str: string) => void,
	registration?: () => void
}

interface SigninError {
	error: string
}

const SignIn = ({ onSucess, onError, registration }: Props) => {
	const [ signupDto, setSignupDto ] = useState<SignUpDto>()
	const [ resendEmail, setResendEmail ] = useState(false)
	const [ resetPass, setResetPass ] = useState(false)

	const onResendConfirm = async () => {
		setResendEmail(false)
		if (!signupDto) return
		try {
			await makeFetcher(resendConfirmEmail)(signupDto)
		} catch (err) {
			if (err instanceof ApiError) onError && onError(err.message)
		}
	}

	const onResetPassword = async () => {
		if(!signupDto) {
			onError && onError('Для сброса пароля, введите хотя бы EMail')
			return
		}
		try{
			await makeFetcher(sendResetPasssword)(signupDto)
			setResetPass(false)
		}catch(err){
			if (err instanceof ApiError) onError && onError(err.message)
			else onError && onError(JSON.stringify(err))
		}
	}

	const onSubmit = async () => {
		setResendEmail(false)
		onError && onError('')
		const fE = (signupDto?.email.indexOf('@') ?? -1) === -1


		if (fE || !signupDto) {
			onError && onError('Email введен неверно')
			return
		}

		try {
			const status = await signIn('credentials', {
				redirect: false,
				email: signupDto.email,
				password: signupDto.password,
			}) as SignInResponse | undefined

			if (status?.error) {
				if (status.error === ConfirmEmailError.message)
					setResendEmail(true)
				else onError && onError(status.error)
				return
			}
			onSucess && onSucess()
		} catch (err) {
			if (err instanceof ApiError) onError && onError(err.message)
			else onError && onError(JSON.stringify(err))
		}
	}

	return (
		<article className={styles.content}>
			<header>Войти</header>
			<input type={'email'} placeholder="EMAIL"
				value={signupDto?.email}
				onChange={onChangeDto('email', setSignupDto)} />
			<input type={'password'} placeholder="ПАРОЛЬ"
				value={signupDto?.password}
				onChange={onChangeDto('password', setSignupDto)} />
			<section className={styles.buttons}>
				<button className={styles.primary}
					onClick={onSubmit}>Зайти в кабинет</button>
				<button className={styles.secondary}
					onClick={() => registration && registration()}>
					Регистрация
				</button>
				<button className={styles.secondary}
					onClick={() => setResetPass(true)}>
					Воостановить пароль
				</button>
				{resendEmail && <section className={styles.resendEmail}>
					<header>Почта не подтверждена</header>
					Ваш адрес электронной почты {signupDto?.email} не подтвержден. Если вам не пришло письмо с подтверждением,
					воспользуйтесь функцией "Выслать подтверждение заново".
					<button onClick={onResendConfirm}>Выслать подтверждение заново</button>
				</section>
				}
				{resetPass && <article className={styles.modal}>
					<section className={styles.body}>
						<section className={styles.close}>
							<div onClick={() => setResetPass(false)}>
								<Image src={close} layout="fill" objectFit="contain" />
							</div>
						</section>
						<section className={styles.content}>
							<header>Сброс пароля</header>
							<section>Для сброса пароля на почту {signupDto?.email} будет выслано письмо с инструкцией.</section>
							<button onClick={onResetPassword}>Сбросить</button>
						</section>
					</section>
				</article>}
			</section>
		</article>
	)
}


export default SignIn

