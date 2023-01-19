import styles from '@/styles/controls/Checkbox.module.scss'

export interface Props {
	isHorizontal?: boolean
	label?: string
	value?: boolean,
	disabled?: boolean
	onChange?: (value: boolean) => void
}

const Checkbox = ({ label, isHorizontal, value, onChange, disabled }: Props) => {
	return (
		<label className={`${styles.checkBox} ${isHorizontal && styles.isHorizontal}`}>
			<span>
				{label}
			</span>
			<input type={'checkbox'}
				disabled={disabled}
				checked={value}
				onChange={v => onChange && onChange(v.target.checked)}></input>
		</label>
	)
}

export default Checkbox
