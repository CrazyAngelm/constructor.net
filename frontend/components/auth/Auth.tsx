import styles from '@/styles/auth/Auth.module.scss'
import Image from 'next/image'
import { ReactNode, useState } from 'react'
import { useRouter } from 'next/router'
import SignIn from './SignIn'
import close from '@/assets/close.svg'
import SignUp from './SignUp'

export interface Props {
	button?: ReactNode,
	visible?: boolean,
	redirectTo?: string
}

const Auth = ({ button, visible: _visible, redirectTo }: Props) => {
	const router = useRouter()
	const [ visible, setVisible ] = useState(_visible)
	const [ isRegistration, setRegistration ] = useState(false)
	const [ regSucess, setRegSucess ] = useState(false)
	const [ error, setError ] = useState<string | undefined>()

	const onSucess = () => {
		setError(undefined)
		setVisible(false)
		if (redirectTo) void router.push(redirectTo)
	}

	const onRegSucess = () => {
		setError(undefined)
		setVisible(false)
		setRegSucess(true)
	}

	const visibleRegistration = (b:boolean) => {
		setRegistration(b)
		setError(undefined)
	}

	return (
		<article className={styles.auth}>
			<div onClick={() => setVisible(v => !v)}>
				{button}
			</div>
			{regSucess
				&& <article className={styles.modal}>
					<section className={styles.notification}>
						<header>
							<p>Регистрация прошла успешно!</p>
							<button onClick={() => setRegSucess(false)}></button>
						</header>
						<section>
								Вы успешно зарегистрировались, для подтверждения на почту было отправлено письмо.
								Подтвердите почту и войдите в аккаунт.
						</section>
					</section>
				</article>
			}
			{visible
				? <section className={styles.modal}>
					<section className={styles.body}>
						<section className={styles.close}>
							<div onClick={() => setVisible(false)}>
								<Image src={close} alt="" layout="fill" objectFit="contain" />
							</div>
						</section>
						{isRegistration
							? <SignUp onSucess={onRegSucess}
								onError={setError}
								auth={() => visibleRegistration(false)} />
							: <SignIn onSucess={onSucess}
								onError={setError}
								registration={() => visibleRegistration(true)} />
						}
						{error
							&& <div className={styles.error}>
								{error}
							</div>}
					</section>
				</section>
				: null}
		</article>
	)
}

export default Auth
