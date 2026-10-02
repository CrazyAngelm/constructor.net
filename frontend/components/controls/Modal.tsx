import styles from '@/styles/auth/Auth.module.scss'
import close from '@/assets/close.svg'
import Image from 'next/image'
import { ReactNode } from 'react'

export interface Props {
	closeCallback: () => void
	visible?: boolean
	children?: ReactNode
}

const Modal = ({ closeCallback, children, visible }: Props) => {
	return <>{visible && (
		<article className={styles.auth}>
			<section className={styles.modal}>
				<section className={styles.body}>
					<section className={styles.close}>
						<div onClick={closeCallback}>
							<Image src={close} alt="" layout="fill" objectFit="contain" />
						</div>
					</section>
					<section className={styles.not}>
						{children}
					</section>
				</section>
			</section>
		</article>
	)}
	</>
}

export default Modal
