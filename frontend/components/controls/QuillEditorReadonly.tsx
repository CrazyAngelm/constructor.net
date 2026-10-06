import styles from '@/styles/controls/ManualHtml.module.scss'
import { sanitizeManualHtml } from '@/lib/manuals/sanitize'


export interface Props {
	value?: string
}

const QuillEditorReadonly = ({ value }: Props) => {
	return (
		<article
			className={styles.manualHtml}
			dangerouslySetInnerHTML={{ __html: sanitizeManualHtml(value ?? '') }}
		>
		</article>
	)
}

export default QuillEditorReadonly


