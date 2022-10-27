import { useEffect, useState } from 'react'

import { useFetchData } from '@/lib/hooks/useFetchData'
import {
	getCourses, getTaskCategoryById, getTasksByIdCategory,
	removeTaskCategory, updateTask, updateTaskCategory
} from '@/lib/requests/tasks'
import { handleErrorTsx } from '@/lib/requests'
import { changeHanderDtoString as changeHanderDto } from '@/lib/changeHandler'

import styles from '@/styles/adm/editors/TaskCategory.module.scss'

import EditorTemplate, { Notification } from '../EditorTemplate'
import Field from '@/components/controls/Fields'
import TextArea from '@/components/controls/TextArea'
import List from '../../List'
import ButtonsList from '../ButtonsList'
import TaskEditor from '../hierarchy/TaskEditor'
import { TaskDto } from '@/lib/dto/tasks'


export interface Props {
	id: number
	courseId?: number
	callbackUpdate?: () => void
	callbackBack?: () => void
	callbackSelectTask?: (id: number) => void
}

const TaskCategoriesEditor = ({ id, courseId, callbackUpdate, callbackBack, callbackSelectTask }: Props) => {
	const [ errorMsg, setError ] = useState<string | undefined>('')
	const [ notification, setNotification ] = useState<Notification>()

	const { data, update, setData, error } = useFetchData(id, getTaskCategoryById,
		id === -1
			? { id: -1, name: 'Без названия', description: '' }
			: undefined)

	const { data: tasks, update: updateTasks, error: errorTask } = useFetchData(id, getTasksByIdCategory)

	const { data: courses } = useFetchData({}, getCourses)

	const choiseCourses = (values: boolean[]) => {
		setData(data => {
			if (!data) return data
			//data.courses = courses?.filter((p, i) => values[ i ]).map(p => p.id)
			return { ...data }
		})
	}

	const save = () => {
		if (!data) {
			setError('Error: id == undefined || user == undefined')
			return
		}
		updateTaskCategory(id, data)
			.then((p) => {
				setNotification(() => { return { color: 'sucess', msg: 'Сохранено' } as Notification })
				callbackUpdate && callbackUpdate()
			})
			.catch(err => handleErrorTsx(err, setError))
	}

	const remove = () => {
		removeTaskCategory(id)
			.then(() => {
				callbackUpdate && callbackUpdate()
				callbackBack && callbackBack()
			})
			.catch(err => handleErrorTsx(err, setError))
	}

	const updateAll = () => {
		update()
		updateTasks()
	}

	const setTaskId = (id?: number) => {
		callbackSelectTask && callbackSelectTask(id ? id : -1)
	}

	const createTask = () => {
		updateTask(-1, { id: -1, categories: [ id ] } as TaskDto).then(p => setTaskId(p.id))
	}

	return (data ?
		<EditorTemplate notification={notification} callbackUpdate={updateAll} error={errorMsg}
			callbackBack={callbackBack} callbackSave={save} callbackRemove={remove} >
			<article className={`${styles.editor} ${styles.withList}`}>
				<section className={styles.props}>
					<Field isHorizontal label='id' type='text' value={data.id.toString()} isReadonly />
					<Field onChange={changeHanderDto('name', setData)}
						isHorizontal label='Название' type='text' value={data.name} />
					<TextArea className={styles.description} onChange={changeHanderDto('description', setData)}
						label='Описание' value={data.description} />
				</section>
				<section className={styles.list}>
					{tasks
						? <List name='Задания'
							length={tasks.length}
							rows={[ {
								header: 'id',
								value: i => tasks[ i ]?.id.toString() as string,
							}, {
								header: 'Название',
								value: i => tasks[ i ]?.name as string
							} ]}
							callback={i => setTaskId(tasks[ i ]?.id)} />
						: errorTask
					}
					<ButtonsList callbackCreate={createTask} />
				</section>
			</article>
		</EditorTemplate >
		: <article className={styles.error}>{error}</article>
	)
}

export default TaskCategoriesEditor
