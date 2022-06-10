import Field from '@/components/controls/Fields'
import TextArea from '@/components/controls/TextArea'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { ApiError } from '@/lib/requests'
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

	const changeHander = (field: 'name' | 'description'): ((value: string) => void) => {
		return v => {
			setData(d => {
				if (!d) return d
				d[ field ] = v
				return { ...d }
			})
		}
	}

	const save = () => {
		if (!id || !data) {
			setError('Error: id == undefined || user == undefined')
			return
		}
		data.taskCategoryId = categoryId ? categoryId : -1
		updateTask(id, data)
			.then(() => {
				setNotification(() => { return { color: 'sucess', msg: 'Сохранено' } as Notification })
				callbackUpdate && callbackUpdate()
			})
			.catch(err => {
				console.log(err)
				if (err instanceof ApiError) setError(() => err.message)
				else setError(JSON.stringify(err))
			})
	}

	const remove = () => {
		if (!id) {
			setError('Error: id == undefined')
			return
		}

		removeTask(id)
			.then(() =>
				callbackBack && callbackBack())
			.catch(err => {
				console.log(err)
				if (err instanceof ApiError) setError(() => err.message)
				else setError(JSON.stringify(err))
			})
	}


	return <EditorTemplate callbackRemove={remove} notification={notification}
		callbackSave={save} callbackUpdate={update} error={error}>
		{data
			? <article className={styles.editor}>
				<section className={styles.props}>
					<Field isHorizontal label='id' type='text' value={data.id.toString()} isReadonly />
					<Field onChange={changeHander('name')}
						isHorizontal label='Название' type='text' value={data.name} />
					<TextArea onChange={changeHander('description')}
						isFixedSize label='Описание' value={data.description} />
				</section>
			</article>
			: <article>Error: {error}</article>}
	</EditorTemplate>
}

export default TaskEditor
