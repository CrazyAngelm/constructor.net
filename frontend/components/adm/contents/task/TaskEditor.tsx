import Field from '@/components/controls/Fields'
import TextArea from '@/components/controls/TextArea'
import { changeHanderDtoString } from '@/lib/changeHandler'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { ApiError, handleErrorTsx } from '@/lib/requests'
import { getTaskById, removeTask, updateTask } from '@/lib/requests/tasks'
import styles from '@/styles/adm/editors/Task.module.scss'
import { useEffect, useState } from 'react'
import EditorTemplate, { Notification } from '../EditorTemplate'

export interface Props {
	id: number
	categoryId?: number
	callbackUpdate?: () => void
	callbackBack?: () => void
}

const TaskEditor = ({ id, categoryId, callbackUpdate, callbackBack }: Props) => {
	const [ errorMsg, setError ] = useState<string | undefined>('')
	const [ notification, setNotification ] = useState<Notification>()
	const { data, update, setData, error } = useFetchData(id, getTaskById,
		id === -1 ? { id: -1 } : undefined)

	const save = () => {
		if (!data) {
			setError('Error: id == undefined || user == undefined')
			return
		}
		data.taskCategoryId = categoryId ? categoryId : -1
		updateTask(data.id, data)
			.then(() => {
				setNotification(() => { return { color: 'sucess', msg: 'Сохранено' } as Notification })
				callbackUpdate && callbackUpdate()
			})
			.catch(err => handleErrorTsx(err, setError))
	}

	const remove = () => {
		removeTask(id)
			.then(() =>
				callbackBack && callbackBack())
			.catch(err => handleErrorTsx(err, setError))
	}


	return <EditorTemplate callbackRemove={remove} notification={notification}
		callbackSave={save} callbackUpdate={update} error={errorMsg}>
		{data
			? <article className={styles.editor}>
				<section className={styles.props}>
					<Field isHorizontal label='id' type='text' value={data.id.toString()} isReadonly />
					<Field onChange={changeHanderDtoString('name', setData)}
						isHorizontal label='Название' type='text' value={data.name} />
					<TextArea onChange={changeHanderDtoString('description', setData)}
						isFixedSize label='Описание' value={data.description} />
				</section>
				<input type={'image'} />
			</article>
			: <article>Error: {error}</article>}
	</EditorTemplate>
}

export default TaskEditor
