import { FormEvent, ReactNode, useState } from 'react'

import { signIn } from 'next-auth/react'

import styles from '@/styles/auth/SignUp.module.scss'

import { onChangeDto } from '@/lib/changeHandler'
import { SignUpDto } from '@/lib/dto/users'
import { ApiError } from '@/lib/requests'


export interface Props {
	button?: ReactNode,
	visible?: boolean
}

interface SigninError{
	error: string
}

const SignIn = ({ button, visible: _visible }: Props) => {

	const [ visible, setVisible ] = useState(_visible)

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
			setVisible(false)
		} catch (err) {
			if (err instanceof ApiError) console.log(err)
			console.log(err)
		}
	}

	return (
		<article className={styles.signup}>
			<div onClick={() => setVisible(p => !p)}>
				{button}
			</div>
			{visible &&
				<article className={styles.signupModal}>
					<section className={styles.background}></section>
					<section className={styles.body}>
						<header>
							<p>Вход</p>
							<button onClick={() => setVisible(false)}/>
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
			}
		</article>
	)
}

export default SignIn
