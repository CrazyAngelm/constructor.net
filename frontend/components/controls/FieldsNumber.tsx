import styles from '@/styles/controls/Field.module.scss'
import { useId } from 'react'

export interface Props {
	label?: string
	value?: number
	placeholder?: string
	isReadonly?: boolean
	onChange?: (value: number) => void
	isHorizontal?: boolean
}

const FieldNumber = ({ label, value, placeholder, isReadonly, onChange, isHorizontal }: Props) => {
	const id = useId()
	return <section className={`${isHorizontal ? styles.isHorizontal : ''} ${styles.classField}`}>
		<div className={styles.fieldLabel}>
			<label htmlFor={id}>{label}</label>
		</div>
		<div className={styles.fieldBody}>
			<div>
				<input id={id} className={isReadonly ? styles.static : ''}
					type={'number'}
					value={value?value:''}
					readOnly={isReadonly}
					placeholder={placeholder}
					onChange={v => onChange && onChange(Number(v.target.value))} />
			</div>
		</div>
	</section>
}


export default FieldNumber
