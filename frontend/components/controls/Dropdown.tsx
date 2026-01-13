import styles from '@/styles/controls/DropdownCheck.module.scss'
import { useEffect, useState } from 'react'


export interface Props {
	label?: string
	button?: string
	isHorizontal?: boolean
	list?: string[]
	value?: string
	callbackChoise?: (choises: string) => void
}

const Dropdown = ({ label, button, isHorizontal, list, value, callbackChoise }: Props) => {
	const [ active, setActive ] = useState(false)

	const choise = (val: string) => {
		callbackChoise && callbackChoise(val)
		setActive(false)
	}

	return (
		<section className={`${isHorizontal ? styles.isHorizontal : ''} ${styles.dropdownCheck}`}>
			{label
				&& <div className={styles.fieldLabel}><label>{label}</label></div>}
			<div className={`dropdown ${active && 'is-active'} ${styles.fieldBody}`}>
				<div className="dropdown-trigger">
					<button onClick={() => setActive(a => !a)} className="button" aria-haspopup aria-controls="dropdownmenu">
						<span>{button ? button : value}</span>
						<span className="icon is-small">
							<i className="fas fa-angle-down" aria-hidden="true"></i>
						</span>
					</button>
				</div>
				<div className="dropdown-menu" id="dropdownmenu" role="listbox">
					<div className="dropdown-content">
						{
							list?.map((p, i) => <a onClick={() => choise(p)} key={i}
								className={`dropdown-item ${p === value && 'is-active'}`}>
								{p}
							</a>)
						}
					</div>
				</div>
			</div>
		</section >
	)
}

export default Dropdown
