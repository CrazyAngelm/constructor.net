import { useEffect, useState } from 'react'

import { useFetchData } from '@/lib/hooks/useFetchData'
import { getCourseById, getTaskCategoriesByIdCourse,
	removeCourse, updateCourse } from '@/lib/requests/tasks'
import { handleErrorTsx } from '@/lib/requests'
import { handleNonOk } from '@/lib/requests/shared'
import { changeHanderDtoString as changeHanderDto } from '@/lib/changeHandler'
import { CourseDto } from '@/lib/dto/tasks'

import styles from '@/styles/adm/editors/TaskCategory.module.scss'

import Field from '@/components/controls/Fields'
import TextArea from '@/components/controls/TextArea'
import EditorTemplate, { Notification } from '../EditorTemplate'
import TaskCategoriesEditor from './TaskCategoriesEditor'


export interface Props {
	id: number
	callbackUpdate?: () => void
	callbackBack?: () => void
}

const CourseEditor = ({ id, callbackUpdate, callbackBack }: Props) => {
	const [ errorMsg, setError ] = useState<string | undefined>('')
	const [ notification, setNotification ] = useState<Notification>()
	const [ categoryId, setCategoryId ] = useState<number>()
	const [ publishing, setPublishing ] = useState(false)

	const { data, update, setData, error } = useFetchData(id, getCourseById, id === -1 ? { id: -1, name: 'Без названия', description: '' } as CourseDto : undefined)

	const { data: tasks, update: updateCat, error: errorTask } = useFetchData(id, getTaskCategoriesByIdCourse)

	useEffect(() => {
		setCategoryId(() => undefined)
	}, [ id ])

	const save = () => {
		if (!data) {
			setError('Error: id == undefined || user == undefined')
			return
		}
		updateCourse(id, data)
			.then((p) => {
				setData(p)
				setNotification(() => { return { color: 'sucess', msg: 'Сохранено' } as Notification })
				callbackUpdate && callbackUpdate()
			})
			.catch(err => handleErrorTsx(err, setError))
	}

	const togglePublication = async () => {
		if (!data || data.id < 1 || publishing) return
		const visible = !data.visible
		if (!window.confirm(visible
			? `Опубликовать сохранённые материалы курса «${data.name}» для пользователей?`
			: `Снять курс «${data.name}» с публикации? Он исчезнет из каталога пользователей, сохранённые конспекты останутся.`)) return
		setPublishing(true)
		setError('')
		try {
			const result = await fetch(`/api/admin/visibility/course/${data.id}`, {
				method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visible }),
			})
			await handleNonOk(result)
			setData(current => current && { ...current, visible })
			setNotification({ color: 'sucess', msg: visible ? 'Курс опубликован' : 'Курс переведён в черновик' } as Notification)
			callbackUpdate?.()
		} catch (err) {
			handleErrorTsx(err, setError)
		} finally {
			setPublishing(false)
		}
	}

	const remove = () => {
		removeCourse(id)
			.then(() => {
				callbackUpdate && callbackUpdate()
				callbackBack && callbackBack()
			})
			.catch(err => handleErrorTsx(err, setError))
	}

	const updateAll = () => {
		update()
		updateCat()
	}

	return (categoryId ? <TaskCategoriesEditor callbackBack={() => {
		setCategoryId(undefined)
		updateAll()
	}}
	courseId={data?.id} id={categoryId} />
		: data
			? <EditorTemplate callbackBack={callbackBack} notification={notification} callbackUpdate={updateAll} error={errorMsg}
				callbackSave={save} callbackRemove={remove} >
				<article className={styles.editor}>
					<section className={styles.props}>
						<section className={styles.publication} aria-label="Публикация курса">
							<strong>{data.visible ? 'Опубликован — доступен пользователям' : 'Черновик — виден только администратору'}</strong>
							<p>{data.visible
								? 'Сохранённые изменения этого курса сразу доступны пользователям. Чтобы спокойно дорабатывать курс, сначала снимите его с публикации.'
								: 'Сохраняйте и проверяйте материалы. Кнопка «Сохранить» не публикует курс. Когда он будет готов, нажмите «Опубликовать курс».'}</p>
							<button type="button" disabled={publishing || data.id < 1} onClick={() => void togglePublication()}>{publishing ? 'Сохранение…' : data.visible ? 'Снять курс с публикации' : 'Опубликовать курс'}</button>
						</section>
						<Field isHorizontal label="id" type="text" value={data.id.toString()} isReadonly />
						<Field onChange={changeHanderDto('name', setData)}
							isHorizontal label="Название" type="text" value={data.name} />
						<TextArea className={styles.description} onChange={changeHanderDto('description', setData)}
							 label="Описание" value={data.description} />
					</section>
					{/* <section className={styles.list}>
						{tasks
							? <List name='Категории'
								length={tasks.length}
								rows={[ {
									header: 'id',
									value: i => tasks[ i ]?.id.toString() as string,
								}, {
									header: 'Название',
									value: i => tasks[ i ]?.name as string
								} ]}
								callback={i => setCategoryId(tasks[ i ]?.id)} />
							: errorTask
						}
						<ButtonsList callbackCreate={() => setCategoryId(-1)} />
					</section> */}
				</article>
			</EditorTemplate >
			: <article className={styles.error}>{error}</article>
	)
}

export default CourseEditor
