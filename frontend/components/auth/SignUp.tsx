import { useState } from 'react'

import styles from '@/styles/auth/Auth.module.scss'

import { onChangeDto } from '@/lib/changeHandler'
import { SignUpDto } from '@/lib/dto/users'
import { ApiError } from '@/lib/requests'
import { signUp } from '@/lib/requests/auth'

export interface Props {
	onSucess?: () => void,
	onError?: (str: string) => void,
	auth?: () => void
}

const SignUp = ({ onSucess, onError, auth }: Props) => {
	const [ signupDto, setSignupDto ] = useState<SignUpDto>()
	const [ confirmPassword, setConfirmPassword ] = useState<string>()

	const onSubmit = async () => {

		const fE = (signupDto?.email.indexOf("@") ?? -1) == -1
		const fP = signupDto?.password != confirmPassword

		fE && onError && onError('Email введен неверно')
		fP && onError && onError('Пароль повторен невено попробуйте еще раз')

		if (fE || fP || !signupDto) return

		try {
			await signUp(signupDto)
			onSucess && onSucess()
		} catch (err) {
			if (err instanceof ApiError) onError && onError(err.message)
			else onError && onError(JSON.stringify(err))
		}
	}

	return (
		<article className={styles.content}>
			<header>Регистрация</header>
			<input type={'email'} placeholder="EMAIL"
				value={signupDto?.email}
				onChange={onChangeDto('email', setSignupDto)} />
			<input type={'password'} placeholder="ПАРОЛЬ"
				value={signupDto?.password}
				onChange={onChangeDto('password', setSignupDto)} />
			<input type={'password'} placeholder="ПОВТОРИТЕ ПАРОЛЬ"
				value={confirmPassword}
				onChange={v => setConfirmPassword(v.target.value)} />
			<section className={styles.buttons}>
				<button className={styles.primary}
					onClick={onSubmit}>
					Регистрация
				</button>
				<button className={styles.secondary}
					onClick={() => auth && auth()}>
					Войти
				</button>
			</section>
		</article>
	)
}


export default SignUp

