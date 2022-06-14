import styles from '@/styles/controls/DropdownCheck.module.scss'
import { useEffect, useState } from 'react'


export interface Props {
	label?: string
	button?: string
	isHorizontal?: boolean
	list?: string[]
	value?: boolean[]
	callbackChoise?: (choises: boolean[]) => void
}

const DropdownCheck = ({ label, button, isHorizontal, list, value, callbackChoise }: Props) => {
	const [ active, setActive ] = useState(false)
	const [ choises, setChoises ] = useState<boolean[]>(value
		? value
		: list ? list?.map(p => false) : [])

	useEffect(() => {
		if (value)
			setChoises(() => value)
	}, [ value ])

	const Choise = (index: number) => {
		choises[ index ] = !choises[ index ]
		callbackChoise && callbackChoise(choises)
		setChoises([ ...choises ])
	}

	return (
		<section className={`${isHorizontal ? styles.isHorizontal : ''} ${styles.dropdownCheck}`}>
			{label &&
				<div className={styles.fieldLabel}><label>{label}</label></div>}
			<div className={`dropdown ${active && "is-active"} ${styles.fieldBody}`}>
				<div className="dropdown-trigger">
					<button onClick={() => setActive(a => !a)} className="button" aria-haspopup aria-controls="dropdownmenu">
						<span>{button ? button : 'Выбрать'}</span>
						<span className="icon is-small">
							<i className="fas fa-angle-down" aria-hidden="true"></i>
						</span>
					</button>
				</div>
				<div className="dropdown-menu" id="dropdownmenu" role='listbox'>
					<div className="dropdown-content">
						{
							list?.map((p, i) => <a onClick={() => Choise(i)} key={i}
								className={`dropdown-item ${choises[ i ] && 'is-active'}`}>
								{p}
							</a>)
						}
					</div>
				</div>
			</div>
		</section >
	)
}

export default DropdownCheck
