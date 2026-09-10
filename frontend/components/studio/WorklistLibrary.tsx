import { useState } from 'react'
import type { StudioFolder, StudioWorklist } from '@/lib/studio/types'
import styles from '@/styles/studio.module.scss'

export default function WorklistLibrary({ folders, worklists, currentFolderId, onFolderChange, onOpen, onCreate, onRename, onDelete, busy }: {
	folders: StudioFolder[]; worklists: StudioWorklist[]; currentFolderId: string | null
	onFolderChange: (id: string | null) => void; onOpen: (worklist: StudioWorklist) => void
	onCreate: (name: string) => Promise<boolean>; onRename: (id: string, name: string) => Promise<boolean>; onDelete: (id: string) => Promise<boolean>; busy: boolean
}) {
	const [ filter, setFilter ] = useState('all')
	const [ name, setName ] = useState('')
	const [ editingId, setEditingId ] = useState<string | null>(null)
	const selectedFolder = folders.find(folder => folder.id === filter)
	const visible = worklists.filter(worklist => filter === 'all' || (worklist.personalFolderId || '') === filter)
	return <section className={styles.reopen} aria-label="Личные конспекты">
		<h2>Личные папки и конспекты</h2>
		<p>Папки видны только вам. Например, создайте отдельную папку для каждого ребёнка.</p>
		<label className={styles.libraryField}>Сохранить текущий конспект в папку<select value={currentFolderId || ''} onChange={event => onFolderChange(event.target.value || null)}><option value="">Без папки</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
		<div className={styles.folderEditor}>
			<label>{editingId ? 'Новое название папки' : 'Название новой папки'}<input maxLength={191} value={name} onChange={event => setName(event.target.value)} placeholder="Например: Анна" /></label>
			<button type="button" disabled={busy || !name.trim()} onClick={async () => { const okay = editingId ? await onRename(editingId, name) : await onCreate(name); if (okay) { setName(''); setEditingId(null) } }}>{editingId ? 'Переименовать папку' : 'Создать папку'}</button>
			{editingId && <button type="button" onClick={() => { setEditingId(null); setName('') }}>Отмена</button>}
		</div>
		<label className={styles.libraryField}>Показать конспекты<select value={folders.some(folder => folder.id === filter) || filter === 'all' || filter === '' ? filter : 'all'} onChange={event => setFilter(event.target.value)}><option value="all">Все конспекты</option><option value="">Без папки</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
		{selectedFolder && <div className={styles.folderActions}><button type="button" disabled={busy} onClick={() => { setEditingId(selectedFolder.id); setName(selectedFolder.name) }}>Изменить название</button><button type="button" disabled={busy} onClick={async () => { if (window.confirm(`Удалить папку «${selectedFolder.name}»? Конспекты сохранятся в разделе «Без папки».`) && await onDelete(selectedFolder.id)) { setFilter(''); setEditingId(null); setName('') } }}>Удалить папку</button></div>}
		{visible.map(worklist => <button type="button" className={styles.savedWorklist} key={worklist.id} onClick={() => onOpen(worklist)}>{worklist.name}<span>Открыть</span></button>)}
		{!visible.length && <p>Здесь пока нет сохранённых конспектов.</p>}
	</section>
}
