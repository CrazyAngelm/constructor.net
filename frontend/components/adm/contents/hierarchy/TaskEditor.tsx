import { useState } from 'react'

import { changeHanderDtoNumber, changeHanderDtoString } from '@/lib/changeHandler'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { handleErrorTsx } from '@/lib/requests'
import {
	getTaskById, getTaskCategories, getTaskCategoryById, removeTask,
	updateTask, uploadTaskImage,
} from '@/lib/requests/tasks'

import styles from '@/styles/adm/editors/Task.module.scss'

import DropdownCheck from '@/components/controls/DropdownCheck'
import Field from '@/components/controls/Fields'
import TextArea from '@/components/controls/TextArea'
import Upload from '@/components/controls/Upload'
import EditorTemplate, { Notification } from '../EditorTemplate'
import { makeFetcher } from '@/lib/fetchers'
import FieldNumber from '@/components/controls/FieldsNumber'

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

	const { data, update, setData, error } = useFetchData(id, getTaskById, id === -1
		? { id: -1, name: 'Без названия', description: '', categories: categoryId ? [ categoryId ] : [] }
		: undefined)

	console.log(data)

	const setChoiseCategory = (values: boolean[]) => {
		setData((data) => {
			if (!data) return data
			data.categories = categories?.filter((p, i) => values[i]).map(p => p.id)
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

	const copyDescCategory = () => {
		if (!categoryId) {
			setError('Невозможно скопировать из категори описание, родительская категория не назначена')
			return
		}
		makeFetcher(getTaskCategoryById)(categoryId).then(resp => setData((d) => {
			if (!d) return d
			d.description = resp.description
			return { ...d }
		}))
	}
	return <EditorTemplate callbackBack={callbackBack} callbackRemove={remove} notification={notification}
		callbackSave={save} callbackUpdate={update} error={errorMsg}>
		{data
			? <article className={styles.editor}>
				<section className={styles.row}>
					<section>
						<Field isHorizontal label="id" type="text" value={data.id.toString()} isReadonly />

						<Field onChange={changeHanderDtoString('name', setData)}
							isHorizontal label="Название" type="text" value={data.name} />
						<FieldNumber onChange={changeHanderDtoNumber('complexity', setData)}
							isHorizontal label="Сложность" value={data.complexity} />
						<TextArea onChange={changeHanderDtoString('description', setData)}
							label="Описание" value={data.description} />
						<button onClick={copyDescCategory}>Скопировать из категории</button>
						<TextArea onChange={changeHanderDtoString('instruction', setData)}
							label="Инструкция для ребенка" value={data.instruction} />
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
