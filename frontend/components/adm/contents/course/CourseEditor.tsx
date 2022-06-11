import { useFetchData } from '@/lib/hooks/useFetchData'
import { getCourseById, getTaskCategoriesByIdCourse, getTaskCategoryById, getTasksByIdCategory, removeCourse, removeTaskCategory, updateCourse, updateTaskCategory } from '@/lib/requests/tasks'
import { useEffect, useState } from 'react'
import EditorTemplate, { Notification } from '../EditorTemplate'
import styles from '@/styles/adm/editors/TaskCategory.module.scss'
import Field from '@/components/controls/Fields'
import TextArea from '@/components/controls/TextArea'
import List from '../../List'
import { ApiError, handleErrorTsx } from '@/lib/requests'
import ButtonsList from '../ButtonsList'
import { changeHanderDtoString as changeHanderDto } from '@/lib/changeHandler'
import TaskEditor from '../task/TaskEditor'
import { CourseDto } from '@/lib/dto/tasks'
import TaskCategoriesEditor from '../taskCategories/TaskCategoriesEditor'


export interface Props {
	id: number
	callbackUpdate?: () => void
	callbackBack?: () => void
}

const CourseEditor = ({ id, callbackUpdate, callbackBack }: Props) => {
	const [ errorMsg, setError ] = useState<string | undefined>('')
	const [ notification, setNotification ] = useState<Notification>()
	const [ categoryId, setCategoryId ] = useState<number>()

	const { data, update, setData, error } = useFetchData(id, getCourseById,
		id === -1 ? { id: -1, name: 'Без названия', description: '' } as CourseDto : undefined)

	const { data: tasks, update: updateCat, error: errorTask } = useFetchData(id, getTaskCategoriesByIdCourse)

	const save = () => {
		if (!data) {
			setError('Error: id == undefined || user == undefined')
			return
		}
		updateCourse(id, data)
			.then((p) => {
				setNotification(() => { return { color: 'sucess', msg: 'Сохранено' } as Notification })
				callbackUpdate && callbackUpdate()
			})
			.catch(err => handleErrorTsx(err, setError))
	}

	const remove = () => {
		removeCourse(id)
			.then(() =>
				callbackBack && callbackBack())
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
		: data ?
			<EditorTemplate notification={notification} callbackUpdate={updateAll} error={errorMsg}
				callbackSave={save} callbackRemove={remove} >
				<article className={styles.editor}>
					<section className={styles.props}>
						<Field isHorizontal label='id' type='text' value={data.id.toString()} isReadonly />
						<Field onChange={changeHanderDto('name', setData)}
							isHorizontal label='Название' type='text' value={data.name} />
						<TextArea onChange={changeHanderDto('description', setData)}
							isFixedSize label='Описание' value={data.description} />
					</section>
					<section className={styles.list}>
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
					</section>
				</article>
			</EditorTemplate >
			: <article className={styles.error}>{error}</article>
	)
}

export default CourseEditor
