import styles from '@/styles/controls/TextArea.module.scss'

export interface Props {
	label?: string
	value?: string
	placeholder?: string
	onChange?: (value: string) => void
	isReadonly?: boolean
	isFixedSize?: boolean
}

const TextArea = ({ label, value, placeholder, onChange, isReadonly, isFixedSize }: Props) => {
	return (
		<section className={styles.textArea}>
			<div className={styles.fieldLabel}>
				<label>{label}</label>
			</div>
			<div className={styles.fieldBody}>
				<div>
					<textarea className={`${isReadonly ? styles.static : ''}
					${isFixedSize ? styles.fixed : ''}`}
						value={value}
						readOnly={isReadonly}
						placeholder={placeholder}
						onChange={v => onChange && onChange(v.target.value)} />
				</div>
			</div>
		</section>
	)
}

export default TextArea
