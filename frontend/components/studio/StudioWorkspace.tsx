import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Head from 'next/head'
import { signOut } from 'next-auth/react'
import { useSession } from '@/lib/session/hooks'

import styles from '@/styles/studio.module.scss'

export type StudioTask = {
	id: number
	name: string
	description: string
	instruction: string
	complexity: number | null
	image: string | null
}

export type StudioCategory = {
	id: number
	name: string
	tasks: StudioTask[]
}

export type StudioCourse = {
	id: number
	name: string
	categories: StudioCategory[]
}

type StudioSheet = {
	version: 1
	data: { items: StudioTask[] }
}

export type StudioWorklist = {
	id: string
	name: string
	teacherSheet: StudioSheet
	studentSheet: StudioSheet
	position?: number
	createdAt?: string
	updatedAt?: string
}

type CatalogResponse = { courses: StudioCourse[] }
type WorklistsResponse = { worklists: StudioWorklist[] }

const emptySheet = (): StudioSheet => ({ version: 1, data: { items: [] } })
const initialDraft = (): StudioWorklist => ({
	id: '',
	name: 'Новый конспект',
	teacherSheet: emptySheet(),
	studentSheet: emptySheet(),
})

const normalizeWorklist = (worklist: StudioWorklist): StudioWorklist => ({
	...worklist,
	teacherSheet: worklist.teacherSheet?.version === 1 && Array.isArray(worklist.teacherSheet.data?.items)
		? worklist.teacherSheet : emptySheet(),
	studentSheet: worklist.studentSheet?.version === 1 && Array.isArray(worklist.studentSheet.data?.items)
		? worklist.studentSheet : emptySheet(),
})

function unwrap<T>(value: T | { response: T }): T {
	return 'response' in (value as object) ? (value as { response: T }).response : value as T
}

const StudioWorkspace = () => {
	const session = useSession()
	const [ courses, setCourses ] = useState<StudioCourse[]>([])
	const [ worklists, setWorklists ] = useState<StudioWorklist[]>([])
	const [ draft, setDraft ] = useState<StudioWorklist>(initialDraft)
	const [ selectedTaskId, setSelectedTaskId ] = useState<number | null>(null)
	const [ query, setQuery ] = useState('')
	const [ activeCourse, setActiveCourse ] = useState<number | null>(null)
	const [ loading, setLoading ] = useState(true)
	const [ error, setError ] = useState('')
	const [ saveState, setSaveState ] = useState<'clean' | 'dirty' | 'saving' | 'saved'>('clean')
	const [ activeSheet, setActiveSheet ] = useState<'teacherSheet' | 'studentSheet'>('teacherSheet')
	const [ dragId, setDragId ] = useState<number | null>(null)

	useEffect(() => {
		let active = true
		const load = async () => {
			setLoading(true)
			setError('')
			try {
				const [ catalogResult, worklistsResult ] = await Promise.all([
					fetch('/api/studio/catalog'),
					fetch('/api/studio/worklists'),
				])
				if (!catalogResult.ok || !worklistsResult.ok) throw new Error('Не удалось загрузить рабочие данные.')
				const catalogPayload = unwrap(await catalogResult.json()) as CatalogResponse
				const worklistsPayload = unwrap(await worklistsResult.json()) as WorklistsResponse
				if (!active) return
				setCourses(catalogPayload.courses || [])
				setWorklists((worklistsPayload.worklists || []).map(normalizeWorklist))
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
	const selectedTask = activeItems.find((task) => task.id === selectedTaskId) || null
	const filteredCourses = useMemo(() => courses
		.filter((course) => activeCourse === null || course.id === activeCourse)
		.map((course) => ({
			...course,
			categories: course.categories.map((category) => ({
				...category,
				tasks: category.tasks.filter((task) => `${task.name} ${task.description} ${task.instruction}`.toLowerCase().includes(query.toLowerCase())),
			})).filter((category) => category.tasks.length > 0),
		})).filter((course) => course.categories.length > 0), [ courses, activeCourse, query ])

	const markDirty = (next: StudioWorklist) => {
		if (saveState === 'saving') return
		setDraft(next)
		setSaveState('dirty')
	}
	const replaceActiveItems = (items: StudioTask[]) => markDirty({
		...draft,
		[activeSheet]: { ...draft[activeSheet], data: { items } },
	})

	const addTask = (task: StudioTask) => {
		if (activeItems.some((item) => item.id === task.id)) return
		replaceActiveItems([ ...activeItems, { ...task } ])
		setSelectedTaskId(task.id)
	}

	const updateTask = (key: keyof StudioTask, value: string | number | null) => {
		if (!selectedTask) return
		replaceActiveItems(activeItems.map((task) => task.id === selectedTask.id ? { ...task, [key]: value } : task))
	}

	const removeTask = (id: number) => {
		const items = activeItems.filter((task) => task.id !== id)
		replaceActiveItems(items)
		if (selectedTaskId === id) setSelectedTaskId(items[0]?.id || null)
	}

	const moveTask = (id: number, direction: -1 | 1) => {
		const from = activeItems.findIndex((task) => task.id === id)
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

	const handleDrop = (event: DragEvent<HTMLLIElement>, targetId: number) => {
		event.preventDefault()
		if (dragId === null || dragId === targetId) return
		const from = activeItems.findIndex((task) => task.id === dragId)
		const to = activeItems.findIndex((task) => task.id === targetId)
		if (from < 0 || to < 0) return
		const items = [ ...activeItems ]
		const [ moved ] = items.splice(from, 1)
		if (!moved) return
		items.splice(to, 0, moved)
		replaceActiveItems(items)
		setDragId(null)
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
				}),
			})
			if (!response.ok) throw new Error('Сохранение не выполнено. Проверьте соединение и повторите попытку.')
			const saved = normalizeWorklist(unwrap(await response.json()) as StudioWorklist)
			setDraft(saved)
			setWorklists((current) => [ saved, ...current.filter((worklist) => worklist.id !== saved.id) ])
			setSaveState('saved')
		} catch (cause) {
			setSaveState('dirty')
			setError(cause instanceof Error ? cause.message : 'Сохранение не выполнено.')
		}
	}

	const reopen = (worklist: StudioWorklist) => {
		if (saveState === 'saving') return
		if (saveState === 'dirty' && !window.confirm('Несохранённые изменения будут потеряны. Открыть другой конспект?')) return
		const normalized = normalizeWorklist(worklist)
		setDraft(normalized)
		setSelectedTaskId(normalized[activeSheet].data.items[0]?.id || null)
		setSaveState('clean')
	}

	const chooseSheet = (sheet: 'teacherSheet' | 'studentSheet') => {
		setActiveSheet(sheet)
		setSelectedTaskId(draft[sheet].data.items[0]?.id || null)
	}

	const changeName = (event: ChangeEvent<HTMLInputElement>) => markDirty({ ...draft, name: event.target.value })

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
				<button type="button" className={styles.secondary} onClick={() => window.print()}>Печать / PDF</button>
				<button type="button" className={styles.primary} onClick={() => void save()} disabled={saveState === 'saving'}>Сохранить</button>
			</div>
		</header>

		<fieldset disabled={saveState === 'saving'} className={styles.editable}>
		{error && <div className={styles.alert} role="alert">{error}<button type="button" onClick={() => setError('')}>Закрыть</button></div>}
		{loading ? <div className={styles.loading} aria-label="Загружаем каталог и конспекты"><span /><span /><span /></div> : <div className={styles.layout}>
			<aside className={styles.catalog} aria-label="Каталог заданий">
				<div className={styles.panelHead}><div><span className={styles.eyebrow}>База заданий</span><h2>Каталог</h2></div></div>
				<label className={styles.search}><span className="sr-only">Поиск заданий</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти задание" /></label>
				<label className={styles.courseSelect}>Курс<select value={activeCourse ?? ''} onChange={event => setActiveCourse(event.target.value ? Number(event.target.value) : null)}><option value="">Все курсы</option>{courses.map(course => <option value={course.id} key={course.id}>{course.name}</option>)}</select></label>
				<div className={styles.catalogList}>{filteredCourses.length ? filteredCourses.map((course) => <section key={course.id}><h3>{course.name}</h3>{course.categories.map((category) => <div className={styles.category} key={category.id}><h4>{category.name}</h4>{category.tasks.map((task) => <button className={styles.catalogTask} type="button" key={task.id} onClick={() => addTask(task)} disabled={activeItems.some((item) => item.id === task.id)}><span>{task.name}</span><small>{task.complexity ? `Сложность ${task.complexity}` : 'Без уровня'}</small></button>)}</div>)}</section>) : <p className={styles.empty}>В каталоге пока нет заданий по этому запросу.</p>}</div>
			</aside>

			<section className={styles.builder} aria-label="Состав занятия">
				<div className={styles.builderHead}><div><label htmlFor="worklist-name" className={styles.eyebrow}>Название конспекта</label><input id="worklist-name" value={draft.name} onChange={changeName} /></div><button type="button" className={styles.secondary} onClick={() => { if (saveState === 'dirty' && !window.confirm('Несохранённые изменения будут потеряны. Создать новый конспект?')) return; setDraft(initialDraft()); setSelectedTaskId(null); setSaveState('clean') }}>Новый</button></div>
				<div className={styles.sheetChooser} role="group" aria-label="Редактируемый лист"><button type="button" className={activeSheet === 'teacherSheet' ? styles.activeTab : ''} onClick={() => chooseSheet('teacherSheet')}>Лист педагога <span>{draft.teacherSheet.data.items.length}</span></button><button type="button" className={activeSheet === 'studentSheet' ? styles.activeTab : ''} onClick={() => chooseSheet('studentSheet')}>Лист ученика <span>{draft.studentSheet.data.items.length}</span></button></div>
				{activeItems.length ? <ol className={styles.taskList}>{activeItems.map((task, index) => <li key={task.id} draggable onDragStart={() => setDragId(task.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, task.id)} className={selectedTaskId === task.id ? styles.selected : ''}><button type="button" className={styles.taskSelect} onClick={() => setSelectedTaskId(task.id)}><span className={styles.order}>{index + 1}</span><span><strong>{task.name}</strong><small>{task.instruction || task.description || 'Инструкция не заполнена'}</small></span></button><div className={styles.itemActions}><button type="button" onClick={() => moveTask(task.id, -1)} disabled={index === 0} aria-label={`Поднять «${task.name}»`}>Выше</button><button type="button" onClick={() => moveTask(task.id, 1)} disabled={index === activeItems.length - 1} aria-label={`Опустить «${task.name}»`}>Ниже</button><button type="button" onClick={() => removeTask(task.id)} aria-label={`Удалить «${task.name}»`}>Удалить</button></div></li>)}</ol> : <div className={styles.empty}><h2>Добавьте задания на {activeSheet === 'teacherSheet' ? 'лист педагога' : 'лист ученика'}</h2><p>Выберите задание слева — оно появится в текущем листе и будет доступно для редактирования.</p></div>}
				{worklists.length > 0 && <section className={styles.reopen}><h2>Сохранённые конспекты</h2>{worklists.map((worklist) => <button type="button" key={worklist.id} onClick={() => reopen(worklist)}>{worklist.name}<span>Открыть</span></button>)}</section>}
			</section>

			<aside className={styles.inspector} aria-label="Параметры задания">
				<div className={styles.panelHead}><div><span className={styles.eyebrow}>Редактор</span><h2>{selectedTask ? selectedTask.name : 'Выберите задание'}</h2></div></div>
				{selectedTask ? <div className={styles.form}>
					<label>Название<input value={selectedTask.name} onChange={(event) => updateTask('name', event.target.value)} /></label>
					<label>Описание<textarea value={selectedTask.description} onChange={(event) => updateTask('description', event.target.value)} /></label>
					<label>Инструкция<textarea value={selectedTask.instruction} onChange={(event) => updateTask('instruction', event.target.value)} /></label>
					<label>Сложность<input type="number" min={1} value={selectedTask.complexity ?? ''} onChange={(event) => updateTask('complexity', event.target.value ? Number(event.target.value) : null)} /></label>
					{selectedTask.image && <img className={styles.previewImage} src={selectedTask.image} alt="Предпросмотр задания" />}
				</div> : <p className={styles.empty}>Поля задания появятся здесь после добавления в конспект.</p>}
			</aside>
		</div>}

		</fieldset>
		<section className={styles.manuals} aria-label="Руководства"><span>Нужна инструкция к материалам?</span><Link href="/docs" target="_blank" rel="noreferrer">Открыть руководства ↗</Link></section>
		<section className={styles.sheet} aria-label="Предпросмотр листа">
			<div className={styles.sheetHead}><div><span className={styles.eyebrow}>Предпросмотр</span><h2>{activeSheet === 'teacherSheet' ? 'Лист педагога' : 'Лист ученика'}</h2></div><div className={styles.switch} role="group" aria-label="Версия листа"><button type="button" className={activeSheet === 'teacherSheet' ? styles.activeTab : ''} onClick={() => chooseSheet('teacherSheet')}>Педагог</button><button type="button" className={activeSheet === 'studentSheet' ? styles.activeTab : ''} onClick={() => chooseSheet('studentSheet')}>Ученик</button></div></div>
			<article className={styles.paper}><header><small>LabStudio</small><h2>{draft.name || 'Без названия'}</h2></header>{activeItems.length ? <ol>{activeItems.map((task) => <li key={task.id}><h3>{task.name}</h3>{task.image && <img src={task.image} alt="" />}{task.description && <p>{task.description}</p>}<p>{task.instruction || 'Инструкция не заполнена.'}</p>{task.complexity && <small>Сложность: {task.complexity}</small>}</li>)}</ol> : <p>Выберите задания в каталоге, чтобы увидеть готовый лист.</p>}</article>
		</section>
	</main>
}

export default StudioWorkspace
