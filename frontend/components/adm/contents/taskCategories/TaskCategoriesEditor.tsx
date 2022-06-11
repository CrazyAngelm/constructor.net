import { useFetchData } from '@/lib/hooks/useFetchData'
import { getTaskCategoryById, getTasksByIdCategory, removeTaskCategory, updateTaskCategory } from '@/lib/requests/tasks'
import { useEffect, useState } from 'react'
import EditorTemplate, { Notification } from '../EditorTemplate'
import styles from '@/styles/adm/editors/TaskCategory.module.scss'
import Field from '@/components/controls/Fields'
import TextArea from '@/components/controls/TextArea'
import List from '../../List'
import { ApiError, handleErrorTsx } from '@/lib/requests'
import ButtonsList from '../ButtonsList'
import { changeHanderDtoString as changeHanderDto } from '@/lib/changeHandler'


export interface Props {
	id: number
	callbackUpdate?: () => void
	callbackSelectTask?: (id?: number) => void
	callbackBack?: () => void
}

const TaskCategoriesEditor = ({ id, callbackUpdate, callbackSelectTask, callbackBack }: Props) => {
	const [ errorMsg, setError ] = useState<string | undefined>('')
	const [ notification, setNotification ] = useState<Notification>()

	const { data, update, setData, error } = useFetchData(id, getTaskCategoryById,
		id === -1 ? { id: -1 } : undefined)

	const { data: tasks, error: errorTask } = useFetchData(id, getTasksByIdCategory)

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
			.then(() =>
				callbackBack && callbackBack())
			.catch(err => handleErrorTsx(err, setError))
	}

	return data ?
		<EditorTemplate notification={notification} callbackUpdate={update} callbackSave={save} callbackRemove={remove}>
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
						? <List name='Задания'
							length={tasks.length}
							rows={[ {
								header: 'id',
								value: i => tasks[ i ]?.id.toString() as string,
							}, {
								header: 'Название',
								value: i => tasks[ i ]?.name as string
							} ]}
							callback={i => callbackSelectTask && callbackSelectTask(tasks[ i ]?.id)} />
						: errorTask
					}
					<ButtonsList callbackCreate={() => callbackSelectTask && callbackSelectTask(-1)} />
				</section>
			</article>
		</EditorTemplate>
		: <article className={styles.error}>{error}</article>
}

export default TaskCategoriesEditor
