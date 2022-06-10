import styles from '@/styles/adm/Editor.module.scss'
import { ReactNode, useState } from 'react'
import ButtonsEditor from './ButtonsEditor'

export interface Notification {
	color: 'danger' | 'sucess'
	msg: string
}

export interface Props {
	children: ReactNode
	error?: string
	callbackSave?: () => void
	callbackUpdate?: () => void
	callbackRemove?: () => void
	notification?: Notification
}

const EditorTemplate = ({ children, error, notification, ...callbacks }: Props) => {
	const [ modal, setModal ] = useState(false)

	return (
		<article className={styles.editor}>
			<div className={`${styles.modalWindow} ${modal && styles.isActive}`}>
				<div className={styles.modalBackground}></div>
				<div className={styles.modalContent}>
					<section className={styles.window}>
						<div>Вы уверены что хотите удалить эелемнт?
							Действие необратимо
						</div>
						<section className={styles.buttons}>
							<button className={styles.danger}
								onClick={() => callbacks.callbackRemove && callbacks.callbackRemove()}>Да</button>
							<button onClick={() => setModal(false)}>Отмена</button>
						</section>
					</section>
				</div>
			</div>
			<section className={styles.individualEditor}>
				{children}
			</section>
			<section className={styles.status}>
				<span className={`${notification?.color && styles[ notification?.color ]}`}>{notification?.msg}</span>
			</section>
			{error &&
				<section className={styles.error}>
					<span>Error: </span>
					{error}
				</section>
			}
			<ButtonsEditor callbackSave={callbacks.callbackSave}
				callbackUpdate={callbacks.callbackUpdate}
				callbackRemove={() => setModal(true)} />
		</article>
	)
}

export default EditorTemplate
