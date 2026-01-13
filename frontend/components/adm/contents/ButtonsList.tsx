import styles from '@/styles/adm/Content.module.scss'

export interface Props {
	callbackCreate?: () => void
	callbackDelete?: () => void
}

const ButtonsList = ({ ...callbacks }: Props) => {
	return (
		<section className={styles.buttonsList}>
			{callbacks.callbackCreate
				&& <button onClick={callbacks.callbackCreate}
					className={`${styles.primary} ${styles.button}`}>Создать</button>
			}
			{callbacks.callbackDelete
				&& <button onClick={callbacks.callbackDelete}
					className={`${styles.danger} ${styles.button}`}>Удалить</button>
			}
		</section>
	)
}

export default ButtonsList
