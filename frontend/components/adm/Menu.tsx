import { List, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import styles from '@/styles/adm/Menu.module.scss'
export interface Item { label?: string; callback?: () => void; items?: Item[] }
export interface Categories { label?: string; items?: Item[] }
export interface Props { categories?: Categories[]; activeLabel?: string }
export default function Menu({ categories, activeLabel }: Props) {
	const [open, setOpen] = useState(false)
	const dialog = useRef<HTMLDialogElement>(null)

	useEffect(() => {
		if (open && !dialog.current?.open) dialog.current?.showModal()
		if (!open && dialog.current?.open) dialog.current.close()
	}, [open])

	return <div className={styles.toolbar}>
		<button type="button" className={styles.trigger} aria-controls="admin-navigation" aria-expanded={open} onClick={() => setOpen(true)}>
			<List size={20} aria-hidden="true" />
			Разделы администрирования
		</button>
		<p className={styles.current}>{activeLabel}</p>
		<dialog id="admin-navigation" ref={dialog} className={styles.drawer} aria-labelledby="admin-navigation-title"
			onCancel={event => { event.preventDefault(); setOpen(false) }}
			onClose={() => setOpen(false)}
			onClick={event => {
				if (event.target !== event.currentTarget) return
				const bounds = event.currentTarget.getBoundingClientRect()
				if (event.clientX < bounds.left || event.clientX >= bounds.right || event.clientY < bounds.top || event.clientY >= bounds.bottom) setOpen(false)
			}}>
			<header className={styles.header}>
				<h2 id="admin-navigation-title">Разделы администрирования</h2>
				<button type="button" className={styles.close} aria-label="Закрыть меню" autoFocus onClick={() => setOpen(false)}><X size={20} aria-hidden="true" /></button>
			</header>
			<menu className={styles.menu} aria-label="Разделы администрирования">
				{categories?.map(category => <li key={category.label}>
					<p>{category.label}</p>
					<ul>{category.items?.map(item => <li key={item.label}>
						<button type="button" aria-current={activeLabel === item.label ? 'page' : undefined} onClick={() => { item.callback?.(); setOpen(false) }}>{item.label}</button>
					</li>)}</ul>
				</li>)}
			</menu>
		</dialog>
	</div>
}
