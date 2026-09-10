/* eslint-disable @next/next/no-img-element -- user uploads and catalog thumbnails are authenticated dynamic resources */
import { ChangeEvent, DragEvent, useEffect, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { ImageSquare, Plus, TextT } from '@phosphor-icons/react'
import { signOut } from 'next-auth/react'

import { useSession } from '@/lib/session/hooks'
import {
	catalogTaskToSheetItem,
	emptyStudioSheet,
	upgradeStudioSheet,
} from '@/lib/studio/types'
import type {
	StudioCourse,
	StudioFolder,
	StudioFontFamily,
	StudioImageAlignment,
	StudioPageSettings,
	StudioSheetItem,
	StudioTask,
	StudioWorklist,
} from '@/lib/studio/types'
import CatalogBrowser from './CatalogBrowser'
import SheetPreview from './SheetPreview'
import SheetSettings from './SheetSettings'
import WorklistLibrary from './WorklistLibrary'
import { pairSheetItems, swapSheetPair, unpairSheetItems, updateSheetItem } from '@/lib/studio/items'
import styles from '@/styles/studio.module.scss'

export type { StudioCategory, StudioCourse, StudioTask } from '@/lib/studio/types'

type SheetName = 'teacherSheet' | 'studentSheet'
type WorklistsResponse = { worklists: Array<Omit<StudioWorklist, 'teacherSheet' | 'studentSheet'> & { teacherSheet: unknown; studentSheet: unknown }> }
type CatalogResponse = { courses: StudioCourse[]; canEditFooter: boolean }

const initialDraft = (): StudioWorklist => ({
	id: '',
	name: 'Новый конспект',
	teacherSheet: emptyStudioSheet(),
	studentSheet: emptyStudioSheet(),
})

const normalizeWorklist = (worklist: WorklistsResponse['worklists'][number]): StudioWorklist => ({
	...worklist,
	teacherSheet: upgradeStudioSheet(worklist.teacherSheet as never),
	studentSheet: upgradeStudioSheet(worklist.studentSheet as never),
})

function unwrap<T>(value: T | { response: T }): T {
	return 'response' in (value as object) ? (value as { response: T }).response : value as T
}

const newInstanceId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`

const blankItem = (kind: StudioSheetItem['kind']): StudioSheetItem => ({
	instanceId: newInstanceId(),
	sourceTaskId: null,
	kind,
	name: kind === 'text' ? 'Текстовый блок' : kind === 'spacer' ? '' : 'Своё упражнение',
	description: '',
	instruction: kind === 'text' ? 'Пользовательский текст' : '',
	complexity: null,
	image: null,
	showDescription: true,
	showInstruction: true,
	imageWidthPercent: 100,
	imageAlignment: 'center',
	spacerHeightMm: kind === 'spacer' ? 12 : 0,
})

const readApiError = async (response: Response, fallback: string) => {
	try {
		const body = await response.json()
		return body.message || fallback
	} catch {
		return fallback
	}
}

export default function StudioWorkspace() {
	const session = useSession()
	const [ courses, setCourses ] = useState<StudioCourse[]>([])
	const [ worklists, setWorklists ] = useState<StudioWorklist[]>([])
	const [ folders, setFolders ] = useState<StudioFolder[]>([])
	const [ foldersBusy, setFoldersBusy ] = useState(false)
	const [ refreshing, setRefreshing ] = useState(false)
	const [ refreshStatus, setRefreshStatus ] = useState('')
	const [ printable, setPrintable ] = useState(false)
	const [ canEditFooter, setCanEditFooter ] = useState(false)
	const [ draft, setDraft ] = useState<StudioWorklist>(initialDraft)
	const [ selectedItemId, setSelectedItemId ] = useState<string | null>(null)
	const [ activeCourse, setActiveCourse ] = useState<number | null>(null)
	const [ loading, setLoading ] = useState(true)
	const [ error, setError ] = useState('')
	const [ saveState, setSaveState ] = useState<'clean' | 'dirty' | 'saving' | 'saved'>('clean')
	const [ activeSheet, setActiveSheet ] = useState<SheetName>('teacherSheet')
	const [ dragId, setDragId ] = useState<string | null>(null)
	const [ uploading, setUploading ] = useState(false)

	useEffect(() => {
		let active = true
		const load = async () => {
			setLoading(true)
			setError('')
			try {
				const [ catalogResult, worklistsResult, foldersResult ] = await Promise.all([
					fetch('/api/studio/catalog'),
					fetch('/api/studio/worklists'),
					fetch('/api/studio/folders'),
				])
				if (!catalogResult.ok || !worklistsResult.ok || !foldersResult.ok) throw new Error('Не удалось загрузить рабочие данные.')
				const catalogPayload = unwrap(await catalogResult.json()) as CatalogResponse
				const worklistsPayload = unwrap(await worklistsResult.json()) as WorklistsResponse
				const foldersPayload = unwrap(await foldersResult.json()) as { folders: StudioFolder[] }
				if (!active) return
				setCourses(catalogPayload.courses || [])
				setCanEditFooter(catalogPayload.canEditFooter)
				setActiveCourse(current => current ?? catalogPayload.courses?.[0]?.id ?? null)
				setWorklists((worklistsPayload.worklists || []).map(normalizeWorklist))
				setFolders(foldersPayload.folders)
			} catch (cause) {
				if (active) setError(cause instanceof Error ? cause.message : 'Не удалось загрузить рабочие данные.')
			} finally {
				if (active) setLoading(false)
			}
		}
		void load()
		return () => { active = false }
	}, [])

	useEffect(() => {
		if (saveState !== 'dirty' && saveState !== 'saving') return
		const preventAccidentalClose = (event: BeforeUnloadEvent) => event.preventDefault()
		window.addEventListener('beforeunload', preventAccidentalClose)
		return () => window.removeEventListener('beforeunload', preventAccidentalClose)
	}, [ saveState ])

	const activeItems = draft[activeSheet].data.items
	const selectedItem = activeItems.flatMap(item => item.companion ? [ item, item.companion ] : [ item ]).find(item => item.instanceId === selectedItemId) || null
	const selectedRow = activeItems.find(item => item.instanceId === selectedItemId || item.companion?.instanceId === selectedItemId)
	const markDirty = (next: StudioWorklist) => {
		if (saveState === 'saving') return
		setDraft(next)
		setSaveState('dirty')
	}
	const replaceActiveItems = (items: StudioSheetItem[]) => markDirty({
		...draft,
		[activeSheet]: { ...draft[activeSheet], data: { ...draft[activeSheet].data, items } },
	})
	const addItem = (item: StudioSheetItem) => {
		replaceActiveItems([ ...activeItems, item ])
		setSelectedItemId(item.instanceId)
	}
	const addTask = (task: StudioTask) => addItem(catalogTaskToSheetItem(task, newInstanceId()))
	const updateItem = <K extends keyof StudioSheetItem>(key: K, value: StudioSheetItem[K]) => {
		if (!selectedItem) return
		replaceActiveItems(updateSheetItem(activeItems, selectedItem.instanceId, { [key]: value }))
	}
	const updateSettings = (settings: StudioPageSettings) => markDirty({
		...draft,
		[activeSheet]: { ...draft[activeSheet], data: { ...draft[activeSheet].data, settings } },
	})
	const copySettings = () => {
		const other: SheetName = activeSheet === 'teacherSheet' ? 'studentSheet' : 'teacherSheet'
		markDirty({ ...draft, [other]: { ...draft[other], data: { ...draft[other].data, settings: { ...structuredClone(draft[activeSheet].data.settings), ...(!canEditFooter ? { footer: draft[other].data.settings.footer } : {}) } } } })
	}
	const removeItem = (instanceId: string) => {
		const items = activeItems.filter(item => item.instanceId !== instanceId)
		replaceActiveItems(items)
		if (selectedRow?.instanceId === instanceId) setSelectedItemId(items[0]?.instanceId || null)
	}
	const moveItem = (instanceId: string, direction: -1 | 1) => {
		const from = activeItems.findIndex(item => item.instanceId === instanceId)
		const to = from + direction
		if (from < 0 || to < 0 || to >= activeItems.length) return
		const items = [ ...activeItems ]
		const current = items[from]
		const target = items[to]
		if (!current || !target) return
		items[from] = target
		items[to] = current
		replaceActiveItems(items)
	}
	const handleDrop = (event: DragEvent<HTMLLIElement>, targetId: string) => {
		event.preventDefault()
		if (!dragId || dragId === targetId) return
		const from = activeItems.findIndex(item => item.instanceId === dragId)
		const to = activeItems.findIndex(item => item.instanceId === targetId)
		if (from < 0 || to < 0) return
		const items = [ ...activeItems ]
		const [ moved ] = items.splice(from, 1)
		if (!moved) return
		items.splice(to, 0, moved)
		replaceActiveItems(items)
		setDragId(null)
	}

	const uploadImage = async (file: File): Promise<string | null> => {
		setUploading(true)
		setError('')
		try {
			const form = new FormData()
			form.append('file', file)
			const response = await fetch('/api/studio/uploads', { method: 'POST', body: form })
			if (!response.ok) throw new Error(await readApiError(response, 'Не удалось загрузить изображение.'))
			return (await response.json()).url as string
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Не удалось загрузить изображение.')
			return null
		} finally {
			setUploading(false)
		}
	}
	const addOwnImage = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		event.target.value = ''
		if (!file) return
		const url = await uploadImage(file)
		if (!url) return
		addItem({ ...blankItem('image'), name: file.name.replace(/\.[^.]+$/, '') || 'Своё упражнение', image: url })
	}
	const replaceImage = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		event.target.value = ''
		if (!file) return
		const url = await uploadImage(file)
		if (url) updateItem('image', url)
	}

	const save = async () => {
		setSaveState('saving')
		setError('')
		try {
			const response = await fetch(draft.id ? `/api/studio/worklists/${draft.id}` : '/api/studio/worklists', {
				method: draft.id ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: draft.name,
					teacherSheet: draft.teacherSheet,
					studentSheet: draft.studentSheet,
					personalFolderId: draft.personalFolderId ?? null,
					...(activeCourse === null ? {} : { courseId: activeCourse }),
				}),
			})
			if (!response.ok) throw new Error(await readApiError(response, 'Сохранение не выполнено.'))
			const saved = normalizeWorklist(unwrap(await response.json()) as WorklistsResponse['worklists'][number])
			setDraft(saved)
			setWorklists(current => [ saved, ...current.filter(worklist => worklist.id !== saved.id) ])
			setSaveState('saved')
		} catch (cause) {
			setSaveState('dirty')
			setError(cause instanceof Error ? cause.message : 'Сохранение не выполнено.')
		}
	}
	const reopen = (worklist: StudioWorklist) => {
		if (saveState === 'saving') return
		if (saveState === 'dirty' && !window.confirm('Несохранённые изменения будут потеряны. Открыть другой конспект?')) return
		setDraft(worklist)
		setActiveCourse(worklist.courseId ?? activeCourse)
		setSelectedItemId(worklist[activeSheet].data.items[0]?.instanceId || null)
		setSaveState('clean')
	}
	const chooseSheet = (sheet: SheetName) => {
		setActiveSheet(sheet)
		setSelectedItemId(draft[sheet].data.items[0]?.instanceId || null)
	}
	const changeName = (event: ChangeEvent<HTMLInputElement>) => markDirty({ ...draft, name: event.target.value })
	const refreshCatalog = async () => {
		setRefreshing(true)
		setRefreshStatus('')
		try {
			const response = await fetch('/api/studio/catalog', { cache: 'no-store' })
			if (!response.ok) throw new Error(await readApiError(response, 'Не удалось обновить каталог. Текущий каталог и черновик сохранены.'))
			const payload = unwrap(await response.json()) as CatalogResponse
			const next = payload.courses
			setCanEditFooter(payload.canEditFooter)
			setCourses(next)
			setActiveCourse(current => next.some(course => course.id === current) ? current : next[0]?.id ?? null)
			setRefreshStatus('Каталог обновлён. Черновик не изменён.')
		} catch (cause) {
			setRefreshStatus(cause instanceof Error ? cause.message : 'Не удалось обновить каталог. Черновик не изменён.')
		} finally { setRefreshing(false) }
	}
	const mutateFolder = async (method: 'POST' | 'PUT' | 'DELETE', id?: string, name?: string) => {
		setFoldersBusy(true)
		setError('')
		try {
			const response = await fetch(`/api/studio/folders${id ? `/${id}` : ''}`, { method, headers: { 'Content-Type': 'application/json' }, ...(name === undefined ? {} : { body: JSON.stringify({ name }) }) })
			if (!response.ok) throw new Error(await readApiError(response, 'Не удалось изменить папку.'))
			if (method === 'DELETE') {
				setFolders(current => current.filter(folder => folder.id !== id))
				setWorklists(current => current.map(worklist => worklist.personalFolderId === id ? { ...worklist, personalFolderId: null } : worklist))
				setDraft(current => current.personalFolderId === id ? { ...current, personalFolderId: null } : current)
			} else {
				const folder = unwrap(await response.json()) as StudioFolder
				setFolders(current => [ ...current.filter(value => value.id !== folder.id), folder ].sort((a, b) => a.name.localeCompare(b.name, 'ru')))
			}
			return true
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Не удалось изменить папку.')
			return false
		} finally { setFoldersBusy(false) }
	}

	return <main className={styles.studio}>
		<Head><title>Конструктор занятия — Lab Studio</title></Head>
		<header className={styles.topbar}>
			<Link className={styles.brand} href="/" aria-label="LabStudio — на главную"><Image src="/logo.png" width={42} height={42} alt="LabStudio" priority /></Link>
			<div><span className={styles.eyebrow}>Рабочий кабинет</span><h1>Конструктор занятия</h1></div>
			<div className={styles.actions}>
				<Link href="/lk" target="_blank" rel="noreferrer">Кабинет ↗</Link>
				{session && session !== 'loading' && session.scopes.includes('admin') && <Link href="/adm">Администрирование</Link>}
				<button type="button" className={styles.secondary} onClick={() => { if (saveState === 'dirty' && !window.confirm('Выйти без сохранения изменений?')) return; void signOut({ callbackUrl: '/studio/auth' }) }} disabled={saveState === 'saving'}>Выйти</button>
				<span className={`${styles.status} ${saveState === 'dirty' ? styles.dirty : ''}`} aria-live="polite">{saveState === 'saving' ? 'Сохраняем…' : saveState === 'dirty' ? 'Есть несохранённые изменения' : saveState === 'saved' ? 'Сохранено' : 'Черновик'}</span>
				<button type="button" className={styles.secondary} onClick={() => window.print()} disabled={!printable || uploading} title={!printable ? 'Дождитесь загрузки изображений и устраните предупреждения в предпросмотре' : undefined}>Печать / PDF</button>
				<button type="button" className={styles.primary} onClick={() => void save()} disabled={saveState === 'saving' || uploading || foldersBusy || loading}>Сохранить</button>
			</div>
		</header>

		<fieldset disabled={saveState === 'saving' || uploading || foldersBusy} className={styles.editable}>
			{error && <div className={styles.alert} role="alert">{error}<button type="button" onClick={() => setError('')}>Закрыть</button></div>}
			{loading ? <div className={styles.loading} aria-label="Загружаем каталог и конспекты"><span /><span /><span /></div> : <div className={styles.layout}>
				<CatalogBrowser courses={courses} activeCourse={activeCourse} onCourseChange={setActiveCourse} onAdd={addTask} onRefresh={() => void refreshCatalog()} refreshing={refreshing} refreshStatus={refreshStatus} />

				<section className={styles.builder} aria-label="Состав занятия">
					<div className={styles.builderHead}><div><label htmlFor="worklist-name" className={styles.eyebrow}>Название конспекта</label><input id="worklist-name" value={draft.name} onChange={changeName} /></div><button type="button" className={styles.secondary} onClick={() => { if (saveState === 'dirty' && !window.confirm('Несохранённые изменения будут потеряны. Создать новый конспект?')) return; setDraft(initialDraft()); setSelectedItemId(null); setSaveState('clean') }}>Новый</button></div>
					<div className={styles.sheetChooser} role="group" aria-label="Редактируемый лист"><button type="button" className={activeSheet === 'teacherSheet' ? styles.activeTab : ''} onClick={() => chooseSheet('teacherSheet')}>Лист педагога <span>{draft.teacherSheet.data.items.length}</span></button><button type="button" className={activeSheet === 'studentSheet' ? styles.activeTab : ''} onClick={() => chooseSheet('studentSheet')}>Лист ученика <span>{draft.studentSheet.data.items.length}</span></button></div>
					<div className={styles.insertBar} aria-label="Свои материалы">
						<label className={styles.secondary} aria-disabled={uploading}><ImageSquare size={17} />{uploading ? 'Загружаем…' : 'Своё изображение'}<input type="file" accept="image/png,image/jpeg" onChange={event => void addOwnImage(event)} disabled={uploading} /></label>
						<button type="button" className={styles.secondary} onClick={() => addItem(blankItem('text'))}><TextT size={17} />Добавить текст</button>
						<button type="button" className={styles.secondary} onClick={() => addItem(blankItem('spacer'))}><Plus size={17} />Свободное место</button>
					</div>
					<SheetSettings settings={draft[activeSheet].data.settings} onChange={updateSettings} onCopy={copySettings} canEditFooter={canEditFooter} />
					{activeItems.length ? <ol className={styles.taskList}>{activeItems.map((item, index) => <li key={item.instanceId} draggable onDragStart={() => setDragId(item.instanceId)} onDragOver={event => event.preventDefault()} onDrop={event => handleDrop(event, item.instanceId)} className={selectedItemId === item.instanceId ? styles.selected : ''}>
						<button type="button" className={styles.taskSelect} onClick={() => setSelectedItemId(item.instanceId)}><span className={styles.order}>{index + 1}</span>{item.image && <img src={item.image} alt="" />}<span><strong>{item.kind === 'spacer' ? `Свободное место — ${item.spacerHeightMm} мм` : item.name}</strong><small>{item.kind === 'spacer' ? 'Пустая область на печатном листе' : item.instruction || item.description || 'Текст не заполнен'}</small></span></button>
						{item.companion && <button type="button" className={`${styles.taskSelect} ${selectedItemId === item.companion.instanceId ? styles.selectedColumn : ''}`} onClick={() => setSelectedItemId(item.companion!.instanceId)}><span className={styles.order}>↔</span>{item.companion.image && <img src={item.companion.image} alt="" />}<span><strong>{item.companion.name}</strong><small>Правая колонка · Изменить</small></span></button>}
						<div className={styles.rowActions}>{item.kind !== 'spacer' && <button type="button" onClick={() => { setSelectedItemId(item.instanceId); document.querySelector('[aria-label="Параметры элемента"]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }}>Редактировать</button>}{item.companion ? <><button type="button" onClick={() => replaceActiveItems(swapSheetPair(activeItems, item.instanceId))}>Поменять колонки местами</button><button type="button" onClick={() => replaceActiveItems(unpairSheetItems(activeItems, item.instanceId))}>Разделить колонки</button></> : item.kind !== 'spacer' && activeItems[index + 1] && activeItems[index + 1]?.kind !== 'spacer' && !activeItems[index + 1]?.companion && <button type="button" onClick={() => replaceActiveItems(pairSheetItems(activeItems, item.instanceId))}>Разместить со следующим рядом</button>}</div>
						<div className={styles.itemActions}><button type="button" onClick={() => moveItem(item.instanceId, -1)} disabled={index === 0} aria-label={`Поднять «${item.name || 'свободное место'}»`}>Выше</button><button type="button" onClick={() => moveItem(item.instanceId, 1)} disabled={index === activeItems.length - 1} aria-label={`Опустить «${item.name || 'свободное место'}»`}>Ниже</button><button type="button" onClick={() => removeItem(item.instanceId)} aria-label={`Удалить «${item.name || 'свободное место'}»`}>Удалить</button></div>
					</li>)}</ol> : <div className={styles.empty}><h2>Добавьте материалы на {activeSheet === 'teacherSheet' ? 'лист педагога' : 'лист ученика'}</h2><p>Откройте папку каталога, просмотрите упражнение и добавьте его в текущий лист.</p></div>}
					<WorklistLibrary folders={folders} worklists={worklists} currentFolderId={draft.personalFolderId ?? null} onFolderChange={id => markDirty({ ...draft, personalFolderId: id })} onOpen={reopen} onCreate={name => mutateFolder('POST', undefined, name)} onRename={(id, name) => mutateFolder('PUT', id, name)} onDelete={id => mutateFolder('DELETE', id)} busy={foldersBusy} />
				</section>

				<aside className={styles.inspector} aria-label="Параметры элемента">
					<div className={styles.panelHead}><div><span className={styles.eyebrow}>Настройки выбранного задания</span><h2>{selectedItem ? selectedItem.kind === 'spacer' ? 'Свободное место' : selectedItem.name : 'Выберите элемент'}</h2></div></div>
					{selectedItem ? <div className={styles.form}>
						{selectedItem.kind === 'spacer' ? <label>Высота, мм<input type="number" min="1" value={selectedItem.spacerHeightMm} onChange={event => updateItem('spacerHeightMm', Number(event.target.value))} /></label> : <>
							<label>Название<input value={selectedItem.name} onChange={event => updateItem('name', event.target.value)} /></label>
							<label>Описание<textarea value={selectedItem.description} onChange={event => updateItem('description', event.target.value)} /></label>
							<label>Инструкция / текст<textarea value={selectedItem.instruction} onChange={event => updateItem('instruction', event.target.value)} /></label>
							{selectedItem.kind === 'task' && <label>Сложность<input type="number" min="1" value={selectedItem.complexity ?? ''} onChange={event => updateItem('complexity', event.target.value ? Number(event.target.value) : null)} /></label>}
							<label className={styles.checkField}><input type="checkbox" checked={selectedItem.showDescription} onChange={event => updateItem('showDescription', event.target.checked)} /> Показывать описание</label>
							<label className={styles.checkField}><input type="checkbox" checked={selectedItem.showInstruction} onChange={event => updateItem('showInstruction', event.target.checked)} /> Показывать инструкцию</label>
							<label>Шрифт задания<select value={selectedItem.fontFamily ?? ''} onChange={event => updateItem('fontFamily', (event.target.value || undefined) as StudioFontFamily | undefined)}><option value="">Как на листе</option><option value="inherit">LabStudio</option><option value="Arial">Arial</option></select></label>
							<label>Размер текста задания, пт<input type="number" min="1" step="0.5" placeholder="Как на листе" value={selectedItem.fontSizePt ?? ''} onChange={event => updateItem('fontSizePt', event.target.value ? Number(event.target.value) : undefined)} /></label>
							<label>Выравнивание текста<select value={selectedItem.textAlignment ?? 'left'} onChange={event => updateItem('textAlignment', event.target.value as StudioImageAlignment)}><option value="left">Слева</option><option value="center">По центру</option><option value="right">Справа</option></select></label>
							{selectedItem.image && <><label>Ширина изображения, %<input type="number" min="1" max="100" value={selectedItem.imageWidthPercent} onChange={event => updateItem('imageWidthPercent', Number(event.target.value))} /></label><label>Выравнивание<select aria-label="Выравнивание" value={selectedItem.imageAlignment} onChange={event => updateItem('imageAlignment', event.target.value as StudioImageAlignment)}><option value="left">Слева</option><option value="center">По центру</option><option value="right">Справа</option></select></label></>}
							<label className={styles.uploadReplacement}>{selectedItem.image ? 'Заменить изображение' : 'Добавить изображение'}<input type="file" accept="image/png,image/jpeg" onChange={event => void replaceImage(event)} disabled={uploading} /></label>
							{selectedItem.image && <img className={styles.previewImage} src={selectedItem.image} alt="Предпросмотр задания" />}
						</>}
					</div> : <p className={styles.empty}>Нажмите на добавленный элемент, чтобы скорректировать его копию. Каталог при этом не изменится.</p>}
				</aside>
			</div>}
		</fieldset>
		<section className={styles.manuals} aria-label="Руководства"><span>Нужна инструкция к материалам?</span><Link href="/docs" target="_blank" rel="noreferrer">Открыть руководства ↗</Link></section>
		<SheetPreview sheet={draft[activeSheet]} title={draft.name} label={activeSheet === 'teacherSheet' ? 'Лист педагога' : 'Лист ученика'} onPrintable={setPrintable} onResize={saveState === 'saving' || uploading ? undefined : (id, width) => { replaceActiveItems(updateSheetItem(activeItems, id, { imageWidthPercent: width })); setSelectedItemId(id) }} />
	</main>
}
