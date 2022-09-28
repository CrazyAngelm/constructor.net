import { FormEvent, ReactNode, useState } from 'react'

import styles from '@/styles/auth/SignUp.module.scss'

import { onChangeDto } from '@/lib/changeHandler'
import { SignUpDto } from '@/lib/dto/users'
import { ApiError } from '@/lib/requests'
import { signUp } from '@/lib/requests/auth'



export interface Props {
	button?: ReactNode,
	visible?: boolean
}

const SignUp = ({ button, visible: _visible }: Props) => {

	const [ visible, setVisible ] = useState(_visible)
	const [ sucess, setSucess ] = useState(false)

	const [ signupDto, setSignupDto ] = useState<SignUpDto>()
	const [ confirmPassword, setConfirmPassword ] = useState<string>()
	const [ failedEmail, setFailedEmail ] = useState<Boolean>()
	const [ failedPassword, setFailedPassword ] = useState<Boolean>()
	const [ error, setError ] = useState("")

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault()

		const fE = (signupDto?.email.indexOf("@") ?? -1) == -1
		const fP = signupDto?.password != confirmPassword
		setFailedEmail(fE)
		setFailedPassword(fP)

		if (fE || fP || !signupDto) return

		try {
			const status = await signUp(signupDto)
			setVisible(false)
			setSucess(true)
			console.log(status)
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message)
			}
			console.log(err)
		}
	}

	return (
		<article className={styles.signup}>
			<div onClick={() => setVisible(p => !p)}>
				{button}
			</div>
			{sucess &&
				<article className={styles.signupModal}>
					<section className={styles.background}></section>
					<section className={styles.notification}>
						<header>
							<p>Регистрация прошла успешно!</p>
							<button onClick={() => setSucess(false)}></button>
						</header>
						<section>
							Вы успешно зарегистрировались, для подтверждения на почту было отправлено письмо.
							Подтвердите почту и войдите в аккаунт.
						</section>
					</section>
				</article>
			}
			{visible &&
				<article className={styles.signupModal}>
					<section className={styles.background}></section>
					<section className={styles.body}>
						<header>
							<p>Регистрация</p>
							<button onClick={() => setVisible(false)} />
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
							</section>
							<section>
								<label>Повторите пароль:</label>
								<input className={failedPassword ? styles.danger : ''} type='password' onChange={v => setConfirmPassword(v.target.value)} />
								{failedPassword && <p>Invalid confirm password</p>}
								<p>{error}</p>
							</section>
						</section>
						<footer>
							<button onClick={onSubmit} className={styles.submit}>Зарегистрироваться</button>
							{/* <p>Есть аккаунт <a>Войти</a></p> */}
						</footer>
					</section>
				</article>
			}
		</article>
	)
}

export default SignUp
