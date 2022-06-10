import styles from '@/styles/adm/Content.module.scss'

export interface Props {
	callbackSave?: () => void
	callbackUpdate?: () => void
	callbackDelete?: () => void
}

const ButtonsEditor = ({ ...callbacks }: Props) => {
	return (
		<section className={styles.buttonsList}>
			<section className={styles.left}>
				{callbacks.callbackSave &&
					<button onClick={callbacks.callbackSave}
						className={`${styles.primary} ${styles.button}`}>Сохранить</button>
				}
				{callbacks.callbackUpdate &&
					<button onClick={callbacks.callbackUpdate}
						className={`${styles.light} ${styles.button}`}>Обновить</button>
				}
			</section>
			<section className={styles.right}>
				{callbacks.callbackDelete &&
					<button onClick={callbacks.callbackDelete}
						className={`${styles.danger} ${styles.button}`}>
						Удалить
					</button>
				}
			</section>
		</section>
	)
}

export default ButtonsEditor
