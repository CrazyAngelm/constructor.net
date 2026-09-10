/* eslint-disable @next/next/no-img-element -- authenticated catalog images are rendered without the public image optimizer */
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CaretRight, Eye, Plus, X } from '@phosphor-icons/react'

import type { StudioCategory, StudioCourse, StudioTask } from '@/lib/studio/types'
import styles from '@/styles/studio.module.scss'

interface TaskWithPath { task: StudioTask; path: string[] }

const collectCategoryTasks = (node: StudioCategory, path: string[] = []): TaskWithPath[] => {
	const nextPath = [ ...path, node.name ]
	return [
		...node.tasks.map(task => ({ task, path: nextPath })),
		...node.children.flatMap(child => collectCategoryTasks(child, nextPath)),
	]
}

const collectMatches = (nodes: StudioCategory[], query: string, path: string[] = []): TaskWithPath[] =>
	nodes.flatMap(category => {
		const nextPath = [ ...path, category.name ]
		return [
			...category.tasks.filter(task => `${task.name} ${task.description} ${task.instruction}`.toLocaleLowerCase('ru').includes(query))
				.map(task => ({ task, path: nextPath })),
			...collectMatches(category.children, query, nextPath),
		]
	})

const findCategory = (nodes: StudioCategory[], id: number | null): StudioCategory | null => {
	for (const node of nodes) {
		if (node.id === id) return node
		const found = findCategory(node.children, id)
		if (found) return found
	}
	return null
}

const collectPreviewableCategoryIds = (nodes: StudioCategory[]) => {
	const result = new Set<number>()
	const visit = (node: StudioCategory): boolean => {
		let descendantHasTasks = false
		for (const child of node.children) {
			if (visit(child)) descendantHasTasks = true
		}
		const hasTasks = node.tasks.length > 0 || descendantHasTasks
		if (hasTasks) result.add(node.id)
		return hasTasks
	}
	nodes.forEach(visit)
	return result
}

const CategoryNode = ({ node, level, selectedId, openIds, previewableIds, onSelect, onToggle, onPreview }: {
	node: StudioCategory
	level: number
	selectedId: number | null
	openIds: Set<number>
	previewableIds: Set<number>
	onSelect: (category: StudioCategory) => void
	onToggle: (id: number) => void
	onPreview: (category: StudioCategory) => void
}) => {
	const open = openIds.has(node.id)
	return <li>
		<div className={`${styles.treeRow} ${selectedId === node.id ? styles.treeSelected : ''}`} style={{ paddingLeft: `${8 + level * 16}px` }}>
			{node.children.length ? <button type="button" className={styles.treeToggle} onClick={() => onToggle(node.id)} aria-label={`${open ? 'Свернуть' : 'Развернуть'} ${node.name}`} aria-expanded={open}><CaretRight size={14} weight="bold" /></button> : <span className={styles.treeLeaf} />}
			<button type="button" className={styles.treeName} onClick={() => onSelect(node)} aria-expanded={node.children.length ? open : undefined} title={node.children.length ? 'Нажмите, чтобы раскрыть или свернуть папку' : 'Открыть упражнения'}>{node.name}</button>
			{previewableIds.has(node.id) && <button type="button" className={styles.iconButton} onClick={() => onPreview(node)} aria-label={`Посмотреть упражнения раздела «${node.name}»`} title="Посмотреть упражнения"><Eye size={17} /></button>}
		</div>
		{open && node.children.length > 0 && <ul>{node.children.map(child => <CategoryNode key={`${node.id}-${child.id}`} node={child} level={level + 1} selectedId={selectedId} openIds={openIds} previewableIds={previewableIds} onSelect={onSelect} onToggle={onToggle} onPreview={onPreview} />)}</ul>}
	</li>
}

const TaskRow = ({ task, path, onPreview, onAdd }: {
	task: StudioTask
	path?: string[]
	onPreview: (task: StudioTask) => void
	onAdd: (task: StudioTask) => void
}) => <article className={styles.catalogTask}>
	<div><strong>{task.name}</strong>{path && <span>{path.join(' / ')}</span>}<small>{task.complexity ? `Сложность ${task.complexity}` : 'Без уровня'}</small></div>
	<div className={styles.catalogActions}>
		<button type="button" onClick={() => onPreview(task)} aria-label={`Посмотреть «${task.name}»`} title="Посмотреть"><Eye size={17} /></button>
		<button type="button" onClick={() => onAdd(task)} aria-label={`Добавить «${task.name}»`} title="Добавить в текущий лист"><Plus size={17} weight="bold" /></button>
	</div>
</article>

const TaskPreview = ({ task, onClose, onAdd }: { task: StudioTask; onClose: () => void; onAdd: (task: StudioTask) => void }) =>
	createPortal(<div className={styles.modalBackdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
		<section className={styles.previewDialog} role="dialog" aria-modal="true" aria-labelledby="task-preview-title">
			<header><div><span className={styles.eyebrow}>Предварительный просмотр</span><h2 id="task-preview-title">{task.name}</h2></div><button type="button" className={styles.iconButton} onClick={onClose} aria-label="Закрыть просмотр"><X size={20} /></button></header>
			<div className={styles.previewBody}>
				{task.image ? <img src={task.image} alt={task.name} /> : !task.instruction.trim() && !task.description.trim() ? <div className={styles.noImage}>Содержание пока не заполнено</div> : null}
				{task.description && <section><h3>Описание</h3><p>{task.description}</p></section>}
				{task.instruction && <section><h3>Инструкция</h3><p>{task.instruction}</p></section>}
			</div>
			<footer><span>{task.complexity ? `Сложность ${task.complexity}` : 'Сложность не указана'}</span><button type="button" className={styles.primary} onClick={() => { onAdd(task); onClose() }}>Добавить в текущий лист</button></footer>
		</section>
	</div>, document.body)

const CategoryPreview = ({ category, inactive, onClose, onPreview, onAdd }: {
	category: StudioCategory
	inactive: boolean
	onClose: () => void
	onPreview: (task: StudioTask) => void
	onAdd: (task: StudioTask) => void
}) => {
	const tasks = [ ...new Map(collectCategoryTasks(category).map(item => [ item.task.id, item ])).values() ]
	return createPortal(<div className={styles.modalBackdrop} role="presentation" aria-hidden={inactive || undefined} style={inactive ? { display: 'none' } : undefined} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
	<section className={`${styles.previewDialog} ${styles.categoryPreviewDialog}`} role="dialog" aria-modal="true" aria-labelledby="category-preview-title">
		<header><div><span className={styles.eyebrow}>Предварительный просмотр раздела</span><h2 id="category-preview-title">{category.name}</h2></div><button type="button" className={styles.iconButton} onClick={onClose} aria-label="Закрыть просмотр раздела"><X size={20} /></button></header>
		<div className={`${styles.previewBody} ${styles.categoryPreviewGrid}`}>
			{tasks.map(({ task, path }) => <article key={`${path.join('-')}-${task.id}`} className={styles.categoryPreviewCard}>
				<button type="button" className={styles.categoryPreviewOpen} onClick={() => onPreview(task)} aria-label={`Открыть «${task.name}»`}>
					{task.image ? <img src={task.image} alt="" loading="lazy" /> : <span className={styles.textPreview}>{task.instruction.trim() || task.description.trim() || 'Содержание пока не заполнено'}</span>}
					<strong>{task.name}</strong>
					<span>{path.join(' / ')}</span>
					{task.description && <small>{task.description}</small>}
					{!task.image && (task.instruction.trim() || task.description.trim()) && <span className={styles.readMore}>Читать полностью</span>}
				</button>
				<button type="button" className={styles.primary} onClick={() => onAdd(task)}>Добавить</button>
			</article>)}
		</div>
		<footer><span>Упражнений: {tasks.length}</span><button type="button" className={styles.secondary} onClick={onClose}>Закрыть</button></footer>
	</section>
	</div>, document.body)
}

export default function CatalogBrowser({ courses, activeCourse, onCourseChange, onAdd, onRefresh, refreshing, refreshStatus }: {
	courses: StudioCourse[]
	activeCourse: number | null
	onCourseChange: (id: number) => void
	onAdd: (task: StudioTask) => void
	onRefresh: () => void
	refreshing: boolean
	refreshStatus: string
}) {
	const [ query, setQuery ] = useState('')
	const [ navigation, setNavigation ] = useState<Record<number, { selectedId: number | null; openIds: Set<number> }>>({})
	const [ previewTask, setPreviewTask ] = useState<StudioTask | null>(null)
	const [ previewCategory, setPreviewCategory ] = useState<StudioCategory | null>(null)
	const course = courses.find(item => item.id === activeCourse) || courses[0]
	const roots = useMemo(() => course?.categoryTree || [], [ course ])
	const previewableIds = useMemo(() => collectPreviewableCategoryIds(roots), [ roots ])

	const currentNavigation = course ? navigation[course.id] : undefined
	const selectedCategory = findCategory(roots, currentNavigation?.selectedId ?? null) || roots[0] || null
	const selectedCategoryId = selectedCategory?.id ?? null
	const openIds = currentNavigation?.openIds ?? new Set(roots[0] ? [ roots[0].id ] : [])
	const matches = useMemo(() => {
		if (!query.trim()) return []
		const found = collectMatches(roots, query.trim().toLocaleLowerCase('ru'))
		return [ ...new Map(found.map(item => [ item.task.id, item ])).values() ]
	}, [ roots, query ])
	const toggle = (id: number) => {
		if (!course) return
		const next = new Set(openIds)
		if (next.has(id)) next.delete(id)
		else next.add(id)
		setNavigation(current => ({ ...current, [course.id]: { selectedId: id, openIds: next } }))
	}
	const choose = (category: StudioCategory) => {
		if (!course) return
		if (category.children.length) toggle(category.id)
		else setNavigation(current => ({ ...current, [course.id]: { selectedId: category.id, openIds } }))
	}

	return <aside className={styles.catalog} aria-label="Каталог заданий">
		<div className={styles.panelHead}><div><span className={styles.eyebrow}>База заданий</span><h2>Каталог</h2></div><button type="button" className={styles.secondary} onClick={onRefresh} disabled={refreshing}>{refreshing ? 'Обновляем…' : 'Обновить каталог'}</button></div>
		{refreshStatus && <p className={styles.catalogStatus} role="status">{refreshStatus}</p>}
		<label className={styles.search}><span className="sr-only">Поиск заданий</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти задание" /></label>
		<label className={styles.courseSelect}>Курс<select aria-label="Курс" value={course?.id ?? ''} onChange={event => onCourseChange(Number(event.target.value))}>{courses.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
		<div className={styles.catalogList}>
			{query.trim() ? <section className={styles.searchResults}><h3>Результаты поиска</h3>{matches.length ? matches.map(({ task, path }) => <TaskRow key={`${path.join('-')}-${task.id}`} task={task} path={path} onPreview={setPreviewTask} onAdd={onAdd} />) : <p className={styles.empty}>Ничего не найдено.</p>}</section> : <>
				<nav className={styles.categoryTree} aria-label="Папки курса"><ul>{roots.map(root => <CategoryNode key={root.id} node={root} level={0} selectedId={selectedCategoryId} openIds={openIds} previewableIds={previewableIds} onSelect={choose} onToggle={toggle} onPreview={setPreviewCategory} />)}</ul></nav>
				<section className={styles.categoryTasks} aria-label="Упражнения выбранной папки">
					<header><div><span className={styles.eyebrow}>Выбранная папка</span><h3>{selectedCategory?.name || 'Выберите папку'}</h3></div>{selectedCategory?.tasks.length ? <span>{selectedCategory.tasks.length}</span> : null}</header>
					{selectedCategory?.tasks.length ? selectedCategory.tasks.map(task => <TaskRow key={task.id} task={task} onPreview={setPreviewTask} onAdd={onAdd} />) : <p className={styles.empty}>{selectedCategory?.children.length ? 'Выберите вложенную папку с упражнениями.' : 'В этой папке нет упражнений.'}</p>}
				</section>
			</>}
		</div>
		{previewCategory && <CategoryPreview category={previewCategory} inactive={Boolean(previewTask)} onClose={() => setPreviewCategory(null)} onPreview={setPreviewTask} onAdd={onAdd} />}
		{previewTask && <TaskPreview task={previewTask} onClose={() => setPreviewTask(null)} onAdd={onAdd} />}
	</aside>
}
