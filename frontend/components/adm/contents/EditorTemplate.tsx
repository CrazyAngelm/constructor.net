import styles from '@/styles/adm/Editor.module.scss'
import { ReactNode } from 'react'
import ButtonsEditor from './ButtonsEditor'

export interface Props {
	children: ReactNode
	error?: string
	callbackSave?: () => void
	callbackUpdate?: () => void
}

const EditorTemplate = ({ children, error, ...callbacks }: Props) => {
	return (
		<article className={styles.editor}>
			<section className={styles.individualEditor}>
				{children}
			</section>
			{error &&
				<section className={styles.error}>
					<span>Error: </span>
					{error}
				</section>
			}
			<ButtonsEditor callbackSave={callbacks.callbackSave}
				callbackUpdate={callbacks.callbackUpdate} />
		</article>
	)
}

export default EditorTemplate
