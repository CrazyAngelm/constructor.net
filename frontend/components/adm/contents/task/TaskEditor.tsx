import DropdownCheck from '@/components/controls/DropdownCheck'
import Field from '@/components/controls/Fields'
import TextArea from '@/components/controls/TextArea'
import Upload from '@/components/controls/Upload'
import { changeHanderDtoString } from '@/lib/changeHandler'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { ApiError, handleErrorTsx } from '@/lib/requests'
import { getTaskById, getTaskCategories, getTaskCategoriesByIdTask, removeTask, updateCategoriesForTask, updateTask, uploadTaskImage } from '@/lib/requests/tasks'
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
	const [ formData, setFormData ] = useState<FormData>()

	const { data: categories } = useFetchData({}, getTaskCategories)

	const { data, update, setData, error } = useFetchData(id, getTaskById,
		id === -1
			? { id: -1, name: 'Без названия', description: '', categories: categoryId ? [ categoryId ] : [] }
			: undefined)

	console.log(id, categoryId)

	const setChoiseCategory = (values: boolean[]) => {
		setData(data => {
			if (!data) return data
			data.categories = categories?.filter((p, i) => values[ i ]).map(p => p.id)
			return { ...data }
		})
	}

	const save = () => {
		if (!data) {
			setError('Error: id == undefined || user == undefined')
			return
		}
		updateTask(data.id, data)
			.then((resp) => {
				if (formData)
					uploadTaskImage(resp.id, formData).then(p => console.log(p))
				setNotification(() => { return { color: 'sucess', msg: 'Сохранено' } as Notification })
				callbackUpdate && callbackUpdate()
			})
			.catch(err => handleErrorTsx(err, setError))
	}

	const remove = () => {
		removeTask(id)
			.then(() => {
				callbackUpdate && callbackUpdate()
				callbackBack && callbackBack()
			})
			.catch(err => handleErrorTsx(err, setError))
	}

	return <EditorTemplate callbackBack={callbackBack} callbackRemove={remove} notification={notification}
		callbackSave={save} callbackUpdate={update} error={errorMsg}>
		{data
			? <article className={styles.editor}>
				<section className={styles.row}>
					<section>
						<Field isHorizontal label='id' type='text' value={data.id.toString()} isReadonly />
						<DropdownCheck label='Категории' isHorizontal callbackChoise={setChoiseCategory}
							list={categories?.map(p => p.name as string)}
							value={categories?.map(p => data.categories?.find(c => c === p.id) ? true : false)} />
						<Field onChange={changeHanderDtoString('name', setData)}
							isHorizontal label='Название' type='text' value={data.name} />
						<TextArea onChange={changeHanderDtoString('description', setData)}
							isFixedSize label='Описание' value={data.description} />
						<TextArea onChange={changeHanderDtoString('instruction', setData)}
							isFixedSize label='Инструкция для ребенка' value={data.instruction} />
					</section>
					<section className={styles.image}>
						<Upload keyChange={id.toString()} preview value={data.image} onChange={p => setFormData(p)} />
					</section>
				</section>
			</article>
			: <article>Error: {error}</article>}
	</EditorTemplate>
}

export default TaskEditor
