import { ReactNode, useState } from 'react'
import Image from 'next/image'

import styles from '@/styles/adm/Editor.module.scss'

import back from '@/assets/back.svg'

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
	callbackBack?: () => void
	notification?: Notification
}

interface PropsWarningDelete {
	callbackRemove?: () => void
	cancel?: () => void
}

export const WarningDelete = ({ callbackRemove, cancel }: PropsWarningDelete) => {
	return (
		<div className={`${styles.modalWindow} ${styles.isActive}`} role="dialog" aria-modal="true" aria-label="Подтверждение удаления">
			<div className={styles.modalBackground}></div>
			<div className={styles.modalContent}>
				<section className={styles.window}>
					<div>Удалить выбранную запись?
						 Это действие нельзя отменить.
					</div>
					<section className={styles.buttons}>
						<button className={styles.danger}
							onClick={() => callbackRemove && callbackRemove()}>Удалить</button>
						<button onClick={() => cancel && cancel()}>Отмена</button>
					</section>
				</section>
			</div>
		</div>
	)
}

const EditorTemplate = ({ children, error, notification, ...callbacks }: Props) => {
	const [ modal, setModal ] = useState(false)

	return (
		<article className={styles.editor}>
			{callbacks.callbackBack && <button type="button" onClick={callbacks.callbackBack} className={styles.back}>← Назад к списку</button>}
			{modal && <WarningDelete callbackRemove={callbacks.callbackRemove} cancel={() => setModal(false)} />}
			<section className={styles.individualEditor}>
				{children}
			</section>
			<section className={styles.status}>
				<span className={`${notification?.color && styles[notification?.color]}`}>{notification?.msg}</span>
			</section>
			{error
				&& <section className={styles.error}>
					<span>Ошибка: </span>
					{error}
				</section>
			}
			<ButtonsEditor callbackSave={callbacks.callbackSave}
				callbackUpdate={callbacks.callbackUpdate}
				callbackRemove={callbacks.callbackRemove ? () => setModal(true) : undefined} />
		</article>
	)
}

export default EditorTemplate
