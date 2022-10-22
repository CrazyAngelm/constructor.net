import { useFetchData } from '@/lib/hooks/useFetchData'
import { getCourses, getTaskCategoryById, getTasksByIdCategory, removeTaskCategory, updateTaskCategory } from '@/lib/requests/tasks'
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
import DropdownCheck from '@/components/controls/DropdownCheck'


export interface Props {
	id: number
	courseId?: number
	callbackUpdate?: () => void
	callbackBack?: () => void
}

const TaskCategoriesEditor = ({ id, courseId, callbackUpdate, callbackBack }: Props) => {
	const [ errorMsg, setError ] = useState<string | undefined>('')
	const [ notification, setNotification ] = useState<Notification>()
	const [ taskId, setTaskId ] = useState<number>()

	const { data, update, setData, error } = useFetchData(id, getTaskCategoryById,
		id === -1
			? { id: -1, name: 'Без названия', description: '' }
			: undefined)

	const { data: tasks, update: updateTasks, error: errorTask } = useFetchData(id, getTasksByIdCategory)

	const { data: courses } = useFetchData({}, getCourses)

	useEffect(() => {
		setTaskId(() => undefined)
	}, [ id ])

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

	return (taskId ? <TaskEditor callbackBack={() => {
		setTaskId(undefined)
		updateAll()
	}} categoryId={data?.id} id={taskId} />
		: data ?
			<EditorTemplate notification={notification} callbackUpdate={updateAll} error={errorMsg}
				callbackBack={callbackBack} callbackSave={save} callbackRemove={remove} >
				<article className={styles.editor}>
					<section className={styles.props}>
						<Field isHorizontal label='id' type='text' value={data.id.toString()} isReadonly />
						{/* <DropdownCheck label='Курсы' isHorizontal callbackChoise={choiseCourses}
							list={courses?.map(p => p.name as string)}
							value={courses?.map(p => data.courses?.find(c => c === p.id) ? true : false)} /> */}
						<Field onChange={changeHanderDto('name', setData)}
							isHorizontal label='Название' type='text' value={data.name} />
						<TextArea onChange={changeHanderDto('description', setData)}
							isFixedSize label='Описание' value={data.description} />
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
						<ButtonsList callbackCreate={() => setTaskId(-1)} />
					</section>
				</article>
			</EditorTemplate >
			: <article className={styles.error}>{error}</article>
	)
}

export default TaskCategoriesEditor
