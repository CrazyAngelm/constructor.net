import { CourseDto, TaskCategoryDto, TaskDto } from '@/lib/dto/tasks'
import styles from '@/styles/adm/Content.module.scss'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import CourseEditor from '../course/CourseEditor'
import TaskEditor from '../task/TaskEditor'
import TaskCategoriesEditor from '../taskCategories/TaskCategoriesEditor'
import arrow from '@/assets/back.svg'
import addFolder from '@/assets/addFolder.png'
import addFile from '@/assets/addFile.png'
import moveToTask from '@/assets/moveToFolder.png'
import menu from '@/assets/menu.png'
import trash from '@/assets/trash.png'
import { createTaskCategory, getCourseById, getCourses, getTaskCategoriesByIdCategory, getTaskCategoriesByIdCourse, getTaskCategoryById, removeCourse, removeTaskCategory, updateCourse, updateTaskCategory } from '@/lib/requests/tasks'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { makeFetcher } from '@/lib/fetchers'
import { WarningDelete } from '../EditorTemplate'

const getCat = (id: number): TaskCategoryDto => {
	switch (id) {
		case 0: return { id: 0, name: "cat-0", categories: [ 3, 4 ], tasks: [ 0, 1 ] }
		case 1: return { id: 1, name: "cat-1", tasks: [ 2, 3 ] }
		case 2: return { id: 2, name: "cat-2" }
		case 3: return { id: 3, name: 'cat-3', categories: [ 5 ], tasks: [ 4 ] }
		case 4: return { id: 4, name: 'cat-4', tasks: [ 5 ] }
		case 5: return { id: 5, name: 'cat-5' }
	}
	return { id: 1000 }
}

const getTask = (id: number): TaskDto => {
	switch (id) {
		case 0: return { id: 0, name: "task-0" }
		case 1: return { id: 1, name: "task-1" }
		case 2: return { id: 2, name: "task-2" }
		case 3: return { id: 3, name: 'task-3' }
		case 4: return { id: 4, name: 'task-4' }
		case 5: return { id: 5, name: 'task-5' }
	}
	return { id: 1000 }
}


interface PropsItem {
	id: number
	parentId?: number
	name?: string,
	tasks?: number[]
	isCourse?: boolean,
	updater?: Updater
	setCourse?: (id: number) => void,
	setCat?: (id: number) => void,
	setTask?: (id: number) => void
}

const ItemCat = ({ id, parentId: parentId, name: _name, tasks, isCourse, updater, ...setter }: PropsItem) => {
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

	const isOpen = (): boolean => data != null && data.length != 0

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
				<div onClick={() => setOpen(p => !p)}>
					{isOpen() &&
						<div className={`${styles.arrow} ${open && styles.open}`}>
							<Image src={arrow} />
						</div>}
				</div>
				<span onClick={onClick}>{name}</span>
				<section className={styles.menu}>
					<header>
						<Image layout='fill' objectFit='contain' src={menu} />
					</header>
					<section>
						<div onClick={create} className={styles.icon}>
							<Image layout='fill' objectFit='contain' src={addFolder} />
						</div>
						<div onClick={() => setModalDelete(true)} className={styles.icon}>
							<Image layout='fill' objectFit='contain' src={trash} />
						</div>
					</section>
				</section>
			</header>
			{(open && isOpen()) &&
				<section>
					{data?.map(p => (
						<ItemCat parentId={id} setCat={setter.setCat} updater={updater}
							setTask={setter.setTask} id={p.id} name={p.name} tasks={p.tasks} />
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
			{data?.map(p =>
				<ItemCat isCourse id={p.id} name={p.name}
					setCourse={props.setCourse} setCat={props.setCat}
					setTask={props.setTask}
					updater={props.updater} />)}
			<section className={styles.createCourse}
				onClick={() => createCourse(props.setCourse, update)}>Создать курс</section>
		</div>
	)
}

const createCategory = async (parentId: number, isCourse?: boolean, setter?: (id: number) => void, update?: () => void): Promise<void> => {
	console.log("create", parentId, isCourse)
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
		this.callbacks.find(p => p.id == id)?.callback()
	}

	registery(id: number, callback: () => void) {
		this.callbacks.push({ id, callback })
	}
}

const Course = () => {
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
		setCategoryId(() => undefined)
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
				{courseId != undefined && <CourseEditor id={courseId} callbackUpdate={() => updater.update(courseId)} />}
				{categoryId != undefined && <TaskCategoriesEditor id={categoryId} callbackUpdate={() => updater.update(categoryId)} />}
				{taskId != undefined && <TaskEditor id={taskId} />}
			</section>
		</article>
	)
}

export default Course
