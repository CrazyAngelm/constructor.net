import Image from 'next/image'
import { FolderPlus, Trash } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

import { createTaskCategory, getCourseById, getCourses, getTaskCategoriesByIdCategory, getTaskCategoriesByIdCourse, getTaskCategoryById, removeCourse, removeTaskCategory, updateCourse, updateTaskCategory } from '@/lib/requests/tasks'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { makeFetcher } from '@/lib/fetchers'

import arrow from '@/assets/back.svg'
import addFolder from '@/assets/addFolder.png'
import menu from '@/assets/menu.png'
import trash from '@/assets/trash.png'

import styles from '@/styles/adm/Content.module.scss'
import CourseEditor from './CourseEditor'
import TaskEditor from './TaskEditor'
import TaskCategoriesEditor from './TaskCategoriesEditor'
import { WarningDelete } from '../EditorTemplate'


interface PropsItem {
	id: number
	parentId?: number
	name?: string,
	isCourse?: boolean,
	updater?: Updater
	setCourse?: (id: number) => void,
	setCat?: (id: number) => void,
	setTask?: (id: number) => void
}

const ItemCat = ({ id, parentId: parentId, name: _name, isCourse, updater, ...setter }: PropsItem) => {
	const [ isDelete, setDelete ] = useState(false)
	const [ open, setOpen ] = useState(false)
	const [ name, setName ] = useState(_name)
	const [ modalDelete, setModalDelete ] = useState(false)

	const { data, update } = useFetchData(id, isCourse
		? getTaskCategoriesByIdCourse
		: getTaskCategoriesByIdCategory)

	useEffect(() => {
		setName(_name)
	}, [ _name ])

	useEffect(() => {
		updater?.registery(id, callbackUpdate)
	}, [ updater ])

	const isOpen = (): boolean => data !== null && data !== undefined && data.length !== 0

	const onClick = () => {
		if (isCourse && setter.setCourse) setter.setCourse(id)
		else if (setter.setCat) setter.setCat(id)
	}

	const create = async () => {
		await createCategory(id, isCourse, setter.setCat, update)
		setOpen(true)
	}

	const remove = () => {
		setModalDelete(false)
		removeItem(id, isCourse, () => {
			if (parentId)
				updater?.update(parentId)
			if (isCourse)
				setDelete(true)
		})
	}

	const callbackUpdate = () => {
		if (isCourse) makeFetcher(getCourseById)(id).then(p => setName(() => p.name))
		else makeFetcher(getTaskCategoryById)(id).then(p => setName(() => p.name))
		update()
	}

	return isDelete ? null : (
		<div className={styles.item} >
			{modalDelete && <WarningDelete callbackRemove={remove} cancel={() => setModalDelete(false)} />}
			<header>
				<div role="button" tabIndex={0} aria-label={`Развернуть ${name}`} aria-expanded={open} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setOpen(value => !value) } }} onClick={() => setOpen(p => !p)}>
					{isOpen()
						&& <div className={`${styles.arrow} ${open && styles.open}`}>
							<Image src={arrow} alt="" />
						</div>}
				</div>
				<span role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick() } }} onClick={onClick}>{name}</span>
				<section className={styles.menu}>
					<header>
						<Image layout="fill" objectFit="contain" src={menu} alt="" />
					</header>
					<section>
						<button type="button" aria-label={`Добавить папку в ${name}`} title="Добавить папку" onClick={create} className={styles.icon}>
							<FolderPlus size={18} aria-hidden="true" />
						</button>
						<button type="button" aria-label={`Удалить ${name}`} title="Удалить" onClick={() => setModalDelete(true)} className={styles.icon}>
							<Trash size={18} aria-hidden="true" />
						</button>
					</section>
				</section>
			</header>
			{(open && isOpen())
				&& <section>
					{data?.map(p => (
						<ItemCat key={p.id} parentId={id} setCat={setter.setCat} updater={updater}
							setTask={setter.setTask} id={p.id} name={p.name} />
					))}
				</section>
			}
		</div>
	)
}

interface ListProps {
	setCourse?: (id: number) => void,
	setCat?: (id: number) => void,
	setTask?: (id: number) => void
	updater?: Updater
}

const List = (props: ListProps) => {
	const { data, update } = useFetchData({}, getCourses)

	return (
		<div>
			{data?.map(p => <ItemCat key={p.id} isCourse id={p.id} name={p.name}
				setCourse={props.setCourse} setCat={props.setCat}
				setTask={props.setTask}
				updater={props.updater} />)}
			<button type="button" className={styles.createCourse}
				onClick={() => createCourse(props.setCourse, update)}>Создать курс</button>
		</div>
	)
}

const createCategory = async (parentId: number, isCourse?: boolean, setter?: (id: number) => void, update?: () => void): Promise<void> => {
	console.log('create', parentId, isCourse)
	const response = await createTaskCategory(parentId, isCourse)
	setter && setter(response.id)
	update && update()
}

const createCourse = async (setter?: (id: number) => void, update?: () => void): Promise<void> => {
	const response = await updateCourse(-1, { id: -1 })
	setter && setter(response.id)
	update && update()
}
const removeItem = async (id: number, isCourse?: boolean, update?: () => void): Promise<void> => {
	if (isCourse)
		await makeFetcher(removeCourse)(id)
	else
		await makeFetcher(removeTaskCategory)(id)
	update && update()
}
interface UpdaterCallback {
	id: number,
	callback: () => void
}
class Updater {

	callbacks: UpdaterCallback[]

	constructor() {
		this.callbacks = []
	}

	update(id: number) {
		this.callbacks.find(p => p.id === id)?.callback()
	}

	registery(id: number, callback: () => void) {
		this.callbacks.push({ id, callback })
	}
}

const Hierarchy = () => {
	const [ courseId, setCourseId ] = useState<number>()
	const [ categoryId, setCategoryId ] = useState<number>()
	const [ taskId, setTaskId ] = useState<number>()

	const updater = new Updater()

	const selectCourse = (id: number) => {
		setTaskId(() => undefined)
		setCategoryId(() => undefined)
		setCourseId(() => id)
	}
	const selectCategory = (id: number) => {
		setTaskId(() => undefined)
		setCategoryId(() => id)
		setCourseId(() => undefined)
	}
	const selectTask = (id: number) => {
		setTaskId(() => id)
		setCourseId(() => undefined)
	}

	return (
		<article className={styles.content}>
			<section className={styles.list}>
				<List setCourse={selectCourse}
					setCat={selectCategory}
					setTask={selectTask}
					updater={updater} />
			</section>
			<section className={styles.editor}>
				{courseId === undefined && categoryId === undefined && taskId === undefined && <p className={styles.empty}>Выберите курс или папку в списке. Стрелка рядом с названием раскрывает вложенные материалы.</p>}
				{courseId !== undefined && <CourseEditor id={courseId} callbackUpdate={() => updater.update(courseId)} />}
				{(categoryId !== undefined && taskId === undefined) && <TaskCategoriesEditor id={categoryId}
					callbackUpdate={() => updater.update(categoryId)}
					callbackSelectTask={selectTask}/>}
				{taskId !== undefined && <TaskEditor id={taskId} categoryId={categoryId}
					 callbackBack={() => setTaskId(undefined)}/>}
			</section>
		</article>
	)
}

export default Hierarchy
