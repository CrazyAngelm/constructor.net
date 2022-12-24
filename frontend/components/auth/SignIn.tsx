import { FormEvent, ReactNode, useState } from 'react'

import { signIn } from 'next-auth/react'

import styles from '@/styles/auth/Auth.module.scss'

import { onChangeDto } from '@/lib/changeHandler'
import { SignUpDto } from '@/lib/dto/users'
import { ApiError } from '@/lib/requests'

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

	const onSubmit = async () => {
		const fE = (signupDto?.email.indexOf("@") ?? -1) == -1


		if (fE || !signupDto) {
			onError && onError('Email введен неверно');
			return
		}

		try {
			const status = await signIn('credentials', {
				redirect: false,
				email: signupDto.email,
				password: signupDto.password
			}) as any as SigninError

			if (status.error) {
				onError && onError(status.error)
				return
			}
			onSucess && onSucess()
		} catch (err) {
			if (err instanceof ApiError) onError && onError(err.message)
			else onError && onError(JSON.stringify(err))
			console.log(err)
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
			</section>
		</article>
	)
}

const SignIn1 = ({ onSucess, onError }: Props) => {
	const [ signupDto, setSignupDto ] = useState<SignUpDto>()
	const [ failedEmail, setFailedEmail ] = useState<Boolean>()
	const [ error, setError ] = useState<string>()

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault()

		const fE = (signupDto?.email.indexOf("@") ?? -1) == -1
		setFailedEmail(fE)

		if (fE || !signupDto) return

		try {
			const status = await signIn('credentials', {
				redirect: false,
				email: signupDto.email,
				password: signupDto.password
			}) as any as SigninError

			if (status.error) {
				setError(status.error)
				return
			}
			onSucess && onSucess()
		} catch (err) {
			if (err instanceof ApiError) console.log(err)
			console.log(err)
		}
	}

	return (
		<article className={styles.signupModal}>
			<section className={styles.background}></section>
			<section className={styles.body}>
				<header>
					<p>Вход</p>
				</header>
				<section>
					<section>
						<label>Электронная почта:</label>
						<input className={failedEmail ? styles.danger : ''} type={'email'} onChange={onChangeDto('email', setSignupDto)} />
						{failedEmail && <p>Invalid email</p>}
					</section>
					<section>
						<label>Пароль:</label>
						<input type='password' onChange={onChangeDto('password', setSignupDto)} />
						<p>{error}</p>
					</section>
				</section>
				<footer>
					<button onClick={onSubmit} className={styles.submit}>Войти</button>
					{/* <p>Нет аккаунта <a>Зарегистрироваться</a></p> */}
				</footer>
			</section>
		</article>
	)
}

export default SignIn
