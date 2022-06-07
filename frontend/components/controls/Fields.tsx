import styles from '@/styles/controls/Field.module.scss'

export interface Props {
	label?: string
	value?: string
	type?: string
	placeholder?: string
	isReadonly?: boolean
	onChange?: (value: string) => void
	isHorizontal?: boolean
}

const Field = ({ label, value, type, placeholder, isReadonly, onChange, isHorizontal }: Props) => {
	return <section className={`${isHorizontal ? styles.isHorizontal : ''} ${styles.classField}`}>
		<div className={styles.fieldLabel}>
			<label>{label}</label>
		</div>
		<div className={styles.fieldBody}>
			<div>
				<input className={isReadonly ? styles.static : ''}
					type={type}
					value={value}
					readOnly={isReadonly}
					placeholder={placeholder}
					onChange={v => onChange && onChange(v.target.value)} />
			</div>
		</div>
	</section>
}


export default Field
