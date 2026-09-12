import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { FolderSimple, Plus, X } from '@phosphor-icons/react'

import type { StudioFolder, StudioWorklist } from '@/lib/studio/types'
import styles from '@/styles/studio.module.scss'

type Filter = 'all' | 'unfiled' | string

const folderFor = (folders: StudioFolder[], id?: string | null) => folders.find(folder => folder.id === id)?.name || 'Без папки'
const changedAt = (worklist: StudioWorklist) => worklist.updatedAt
	? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(worklist.updatedAt))
	: 'Дата сохранения не указана'

export default function WorklistLibrary({
	open, folders, worklists, currentId, onClose, onOpen, onCreate, onRename, onDeleteFolder,
	onMove, onDeleteWorklist, busy, error, onClearError,
}: {
	open: boolean; folders: StudioFolder[]; worklists: StudioWorklist[]; currentId: string
	onClose: () => void; onOpen: (worklist: StudioWorklist) => void
	onCreate: (name: string) => Promise<StudioFolder | null>; onRename: (id: string, name: string) => Promise<boolean>
	onDeleteFolder: (id: string) => Promise<boolean>; onMove: (worklist: StudioWorklist, folderId: string | null) => Promise<boolean>
	onDeleteWorklist: (worklist: StudioWorklist) => Promise<boolean>; busy: boolean; error: string; onClearError: () => void
}) {
	const [ filter, setFilter ] = useState<Filter>('all')
	const [ name, setName ] = useState('')
	const [ editingId, setEditingId ] = useState<string | null>(null)
	const [ deleteFolderId, setDeleteFolderId ] = useState<string | null>(null)
	const [ deleteWorklistId, setDeleteWorklistId ] = useState<string | null>(null)
	const [ moveChoices, setMoveChoices ] = useState<Record<string, string>>({})

	useEffect(() => {
		if (!open) return
		const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose() }
		document.addEventListener('keydown', closeOnEscape)
		return () => document.removeEventListener('keydown', closeOnEscape)
	}, [ busy, onClose, open ])

	const visible = useMemo(() => worklists
		.filter(worklist => filter === 'all' || (filter === 'unfiled' ? !worklist.personalFolderId : worklist.personalFolderId === filter))
		.sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || ''))), [ filter, worklists ])
	const selectedFolder = typeof filter === 'string' && ![ 'all', 'unfiled' ].includes(filter) ? folders.find(folder => folder.id === filter) : undefined
	const countFor = (id: Filter) => worklists.filter(worklist => id === 'all' || (id === 'unfiled' ? !worklist.personalFolderId : worklist.personalFolderId === id)).length

	if (!open) return null
	return createPortal(<div className={styles.modalBackdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
		<section className={styles.libraryDialog} role="dialog" aria-modal="true" aria-labelledby="worklist-library-title">
			<header className={styles.libraryHeader}>
				<div><span className={styles.eyebrow}>Хранятся в вашем аккаунте</span><h2 id="worklist-library-title">Мои конспекты</h2><p>Выберите папку, затем откройте, переместите или удалите конспект.</p></div>
				<button type="button" className={styles.iconButton} onClick={onClose} disabled={busy} aria-label="Закрыть мои конспекты"><X size={20} /></button>
			</header>
			{error && <div className={styles.libraryError} role="alert">{error}<button type="button" onClick={onClearError}>Закрыть</button></div>}
			<div className={styles.libraryLayout}>
				<aside className={styles.folderPane} aria-label="Папки конспектов">
					<nav>
						<button type="button" aria-label="Все конспекты" className={filter === 'all' ? styles.folderSelected : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}><span>Все конспекты</span><small>{countFor('all')}</small></button>
						<button type="button" aria-label="Без папки" className={filter === 'unfiled' ? styles.folderSelected : ''} aria-pressed={filter === 'unfiled'} onClick={() => setFilter('unfiled')}><span>Без папки</span><small>{countFor('unfiled')}</small></button>
						{folders.map(folder => <button type="button" aria-label={folder.name} key={folder.id} className={filter === folder.id ? styles.folderSelected : ''} aria-pressed={filter === folder.id} onClick={() => setFilter(folder.id)}><span><FolderSimple size={16} />{folder.name}</span><small>{countFor(folder.id)}</small></button>)}
					</nav>
					<div className={styles.folderEditor}>
						<label>{editingId ? 'Новое название папки' : 'Новая папка'}<input maxLength={191} value={name} onChange={event => setName(event.target.value)} placeholder="Например: Анна" /></label>
						<button type="button" className={styles.secondary} disabled={busy || !name.trim()} onClick={async () => {
							if (editingId) {
								if (await onRename(editingId, name)) { setName(''); setEditingId(null) }
							} else {
								const folder = await onCreate(name)
								if (folder) setName('')
							}
						}}>{editingId ? 'Сохранить название' : <><Plus size={15} />Создать папку</>}</button>
						{editingId && <button type="button" className={styles.textButton} onClick={() => { setEditingId(null); setName('') }}>Отмена</button>}
					</div>
					{selectedFolder && <div className={styles.folderManage}>
						<button type="button" className={styles.textButton} disabled={busy} onClick={() => { setEditingId(selectedFolder.id); setName(selectedFolder.name); setDeleteFolderId(null) }}>Переименовать папку</button>
						{deleteFolderId !== selectedFolder.id ? <button type="button" className={styles.dangerLink} disabled={busy} onClick={() => setDeleteFolderId(selectedFolder.id)}>Удалить папку</button> : <div className={styles.inlineConfirm} role="alert"><p>Конспекты останутся и перейдут в «Без папки».</p><div><button type="button" className={styles.dangerButton} disabled={busy} onClick={async () => { if (await onDeleteFolder(selectedFolder.id)) { setFilter('unfiled'); setDeleteFolderId(null) } }}>Удалить папку</button><button type="button" className={styles.textButton} onClick={() => setDeleteFolderId(null)}>Отмена</button></div></div>}
					</div>}
				</aside>

				<section className={styles.worklistPane} aria-label="Сохранённые конспекты">
					<div className={styles.worklistPaneHead}><div><span className={styles.eyebrow}>Выбрано</span><h3>{filter === 'all' ? 'Все конспекты' : filter === 'unfiled' ? 'Без папки' : selectedFolder?.name || 'Папка'}</h3></div><span>{visible.length}</span></div>
					<div className={styles.worklistList}>
						{visible.map(worklist => {
							const deleting = deleteWorklistId === worklist.id
							const requestedMoveValue = moveChoices[worklist.id] ?? worklist.personalFolderId ?? ''
							const moveValue = requestedMoveValue && folders.some(folder => folder.id === requestedMoveValue) ? requestedMoveValue : ''
							return <article className={`${styles.worklistCard} ${currentId === worklist.id ? styles.currentWorklist : ''}`} key={worklist.id}>
								<div className={styles.worklistMeta}><div><h4>{worklist.name}</h4>{currentId === worklist.id && <span className={styles.currentBadge}>Открыт сейчас</span>}</div><p>{folderFor(folders, worklist.personalFolderId)} · {changedAt(worklist)}</p></div>
								<div className={styles.worklistActions}>
									<button type="button" className={styles.primary} disabled={busy} onClick={() => onOpen(worklist)}>Открыть</button>
									<label>Переместить<select aria-label={`Папка для «${worklist.name}»`} value={moveValue} disabled={busy} onChange={event => setMoveChoices(current => ({ ...current, [worklist.id]: event.target.value }))}><option value="">Без папки</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
									<button type="button" className={styles.secondary} disabled={busy || moveValue === (worklist.personalFolderId || '')} onClick={() => void onMove(worklist, moveValue || null)}>Переместить</button>
									{!deleting && <button type="button" className={styles.dangerLink} disabled={busy} onClick={() => setDeleteWorklistId(worklist.id)}>Удалить</button>}
								</div>
								{deleting && <div className={styles.inlineConfirm} role="alert"><p>Удалить «{worklist.name}»? Восстановление через сайт не предусмотрено{currentId === worklist.id ? ', и открытый конспект будет закрыт' : ''}.</p><div><button type="button" className={styles.dangerButton} disabled={busy} onClick={async () => { if (await onDeleteWorklist(worklist)) setDeleteWorklistId(null) }}>Удалить конспект</button><button type="button" className={styles.textButton} onClick={() => setDeleteWorklistId(null)}>Отмена</button></div></div>}
							</article>
						})}
						{!visible.length && <div className={styles.libraryEmpty}><FolderSimple size={28} /><h4>В этой папке пока нет конспектов</h4><p>Закройте окно, соберите занятие и нажмите «Сохранить».</p></div>}
					</div>
				</section>
			</div>
		</section>
	</div>, document.body)
}
