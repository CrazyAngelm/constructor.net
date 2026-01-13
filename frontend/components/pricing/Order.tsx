import styles from '@/styles/auth/Auth.module.scss'
import close from '@/assets/close.svg'
import Image from 'next/image'
import { LicenseDto } from '@/lib/dto/subscription'

export interface Props {
	closeCallback: () => void
	okCallback: () => void
	license?: LicenseDto
}

const Order = ({ closeCallback, okCallback, license }: Props) => {
	return (
		<article className={styles.auth}>
			<section className={styles.modal}>
				<section className={styles.body}>
					<section className={styles.close}>
						<div onClick={closeCallback}>
							<Image src={close} layout="fill" objectFit="contain" />
						</div>
					</section>
					<section className={styles.not}>
						<header>Оформление подписки</header>
						<div>
							Вы собираетесь оформить подписку на тариф
							"{license?.name}" <br />
							Оформляя подписку вы соглашаетесь с <a href="/license" target={'_blank'}>лицензионным соглашением</a>
							<br />
							Подписку можно будет отключить в личном кабинете в любой момент
						</div>
						<section className={styles.buttons}>
							<button onClick={okCallback}>Оформить</button>
						</section>
					</section>
				</section>
			</section>
		</article>
	)
}
export default Order
