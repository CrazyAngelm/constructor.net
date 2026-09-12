import styles from '@/styles/controls/TextArea.module.scss'
import { useId } from 'react'

export interface Props {
	className?:string
	label?: string
	value?: string
	placeholder?: string
	onChange?: (value: string) => void
	isReadonly?: boolean
	isFixedSize?: boolean
}

const TextArea = ({className, label, value, placeholder, onChange, isReadonly, isFixedSize }: Props) => {
	const id = useId()
	return (
		<section className={`${className} ${styles.textArea}`}>
			<div className={styles.fieldLabel}>
				<label htmlFor={id}>{label}</label>
			</div>
			<div className={styles.fieldBody}>
				<div>
					<textarea id={id} className={`${isReadonly ? styles.static : ''}
					${isFixedSize ? styles.fixed : ''}`}
					value={value?value:''}
					readOnly={isReadonly}
					placeholder={placeholder}
					onChange={v => onChange && onChange(v.target.value)} />
				</div>
			</div>
		</section>
	)
}

export default TextArea
