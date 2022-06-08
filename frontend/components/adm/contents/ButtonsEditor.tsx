import styles from '@/styles/adm/Content.module.scss'

export interface Props {
	callbackSave?: () => void
	callbackUpdate?: () => void
}

const ButtonsEditor = ({ ...callbacks }: Props) => {
	return (
		<section className={styles.buttonsList}>
			{callbacks.callbackSave &&
				<button onClick={callbacks.callbackSave}
					className={`${styles.primary} ${styles.button}`}>Сохранить</button>
			}
			{callbacks.callbackUpdate &&
				<button onClick={callbacks.callbackUpdate}
					className={`${styles.light} ${styles.button}`}>Обновить</button>
			}
		</section>
	)
}

export default ButtonsEditor
