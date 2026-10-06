import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'
import type { StudioProgram } from '@/lib/studio/types'
import styles from '@/styles/studio.module.scss'

export default function ProgramLibrary({ open, onClose, onUse, busy }: {
	open: boolean; onClose: () => void; onUse: (program: StudioProgram) => Promise<boolean>; busy: boolean
}) {
	const [programs, setPrograms] = useState<StudioProgram[]>([])
	const [course, setCourse] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	useEffect(() => {
		if (!open) return
		let active = true
		setLoading(true); setError('')
		void fetch('/api/studio/programs', { cache: 'no-store' }).then(async response => {
			if (!response.ok) throw new Error('Не удалось загрузить программы. Повторите открытие раздела.')
			const payload = await response.json()
			if (active) setPrograms(payload.programs)
		}).catch(cause => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) })
		const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose() }
		document.addEventListener('keydown', escape)
		return () => { active = false; document.removeEventListener('keydown', escape) }
	}, [open, onClose, busy])
	if (!open) return null
	const courses = [...new Map(programs.map(program => [program.courseId, program.courseName])).entries()]
	const visible = programs.filter(program => !course || String(program.courseId) === course)
	return createPortal(<div className={styles.modalBackdrop} onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
		<section className={styles.programDialog} role="dialog" aria-modal="true" aria-labelledby="program-library-title">
			<header className={styles.libraryHeader}><div><span className={styles.eyebrow}>Готовые занятия от авторов</span><h2 id="program-library-title">Программы LabStudio</h2><p>Откройте свою копию программы, измените задания и сохраните в «Мои конспекты». Авторский оригинал останется без изменений.</p></div><button type="button" className={styles.iconButton} disabled={busy} onClick={onClose} aria-label="Закрыть программы"><X size={20} /></button></header>
			<div className={styles.programFilter}><label>Курс программы<select value={course} onChange={event => setCourse(event.target.value)}><option value="">Все доступные курсы</option>{courses.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label></div>
			{error && <p className={styles.dialogError} role="alert">{error}</p>}
			<div className={styles.worklistList}>
				{loading ? <p role="status">Загружаем программы…</p> : visible.map(program => <article className={styles.worklistCard} key={program.id}><div className={styles.worklistMeta}><h4>{program.name}</h4><p>{program.courseName}{program.folderName ? ` → ${program.folderName}` : ''}</p></div><button type="button" className={styles.primary} disabled={busy} onClick={async () => { setError(''); if (!await onUse(program)) setError('Не удалось открыть копию программы. Проверьте сообщение в конструкторе и повторите действие.') }}>Открыть свою копию</button></article>)}
				{!loading && !error && !visible.length && <div className={styles.libraryEmpty}><h4>Пока нет опубликованных программ</h4><p>Здесь появятся готовые конспекты для курсов, доступных в вашей подписке.</p></div>}
			</div>
		</section>
	</div>, document.body)
}
