import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X } from '@phosphor-icons/react'

import type { StudioFolder } from '@/lib/studio/types'
import styles from '@/styles/studio.module.scss'

export default function SaveWorklistDialog({ open, initialName, initialFolderId, folders, busy, error, onClose, onSave, onCreateFolder, onClearError }: {
	open: boolean; initialName: string; initialFolderId: string | null; folders: StudioFolder[]; busy: boolean; error: string
	onClose: () => void; onSave: (name: string, folderId: string | null) => Promise<boolean>
	onCreateFolder: (name: string) => Promise<StudioFolder | null>; onClearError: () => void
}) {
	const [ name, setName ] = useState(initialName)
	const [ folderId, setFolderId ] = useState(initialFolderId || '')
	const [ folderName, setFolderName ] = useState('')
	useEffect(() => { if (open) { setName(initialName); setFolderId(initialFolderId || ''); setFolderName('') } }, [ initialFolderId, initialName, open ])
	useEffect(() => {
		if (!open) return
		const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose() }
		document.addEventListener('keydown', closeOnEscape)
		return () => document.removeEventListener('keydown', closeOnEscape)
	}, [ busy, onClose, open ])
	if (!open) return null
	return createPortal(<div className={styles.modalBackdrop} role="presentation">
		<form className={styles.saveDialog} role="dialog" aria-modal="true" aria-labelledby="save-dialog-title" onSubmit={event => { event.preventDefault(); void onSave(name, folderId || null) }}>
			<header><div><span className={styles.eyebrow}>Первое сохранение</span><h2 id="save-dialog-title">Сохранить в моих конспектах</h2></div><button type="button" className={styles.iconButton} onClick={onClose} disabled={busy} aria-label="Закрыть сохранение"><X size={20} /></button></header>
			<div className={styles.saveDialogBody}>
				<p>Конспект сохранится в вашем аккаунте вместе с обоими листами.</p>
				<label>Название конспекта<input autoFocus maxLength={191} value={name} onChange={event => setName(event.target.value)} /></label>
				<label>Папка<select value={folderId} onChange={event => setFolderId(event.target.value)}><option value="">Без папки</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
				<div className={styles.quickFolder}><label>Или создайте новую папку<input maxLength={191} value={folderName} onChange={event => setFolderName(event.target.value)} placeholder="Например: Анна" /></label><button type="button" className={styles.secondary} disabled={busy || !folderName.trim()} onClick={async () => { const folder = await onCreateFolder(folderName); if (folder) { setFolderId(folder.id); setFolderName('') } }}><Plus size={15} />Создать</button></div>
				{error && <div className={styles.dialogError} role="alert">{error}<button type="button" onClick={onClearError}>Закрыть</button></div>}
			</div>
			<footer><button type="button" className={styles.secondary} onClick={onClose} disabled={busy}>Отмена</button><button type="submit" className={styles.primary} disabled={busy || !name.trim()}>{busy ? 'Сохраняем…' : 'Сохранить конспект'}</button></footer>
		</form>
	</div>, document.body)
}
