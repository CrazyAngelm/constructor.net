import { useFetchData } from '@/lib/hooks/useFetchData'
import { getTaskCategoryById, getTasksByIdCategory, updateTaskCategory } from '@/lib/requests/tasks'
import { useState } from 'react'
import EditorTemplate from '../EditorTemplate'
import styles from '@/styles/adm/editors/TaskCategory.module.scss'
import Field from '@/components/controls/Fields'
import TextArea from '@/components/controls/TextArea'
import List from '../../List'
import { ApiError } from '@/lib/requests'
import ButtonsList from '../ButtonsList'


export interface Props {
	id: number
	callbackUpdate?: () => void
	callbackSelectTask?: (id?: number) => void
}

const TaskCategoriesEditor = ({ id, callbackUpdate, callbackSelectTask }: Props) => {
	const [ errorMsg, setError ] = useState<string | undefined>('')

	const { data, update, setData, error } = useFetchData(id, getTaskCategoryById)

	const { data: tasks, error: errorTask } = useFetchData(id, getTasksByIdCategory)

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
		updateTaskCategory(id, data)
			.then(() => callbackUpdate && callbackUpdate())
			.catch(err => {
				console.log(err)
				if (err instanceof ApiError) setError(() => err.message)
				else setError(JSON.stringify(err))
			})
	}

	const createTask = () => {
		callbackSelectTask && callbackSelectTask(0)
	}

	return data ?
		<EditorTemplate callbackUpdate={update} callbackSave={save}>
			<article className={styles.editor}>
				<section className={styles.props}>
					<Field isHorizontal label='id' type='text' value={data.id.toString()} isReadonly />
					<Field onChange={changeHander('name')}
					isHorizontal label='Название' type='text' value={data.name} />
					<TextArea onChange={changeHander('description')}
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
					<ButtonsList callbackCreate={() => callbackSelectTask && callbackSelectTask(-1)}/>
				</section>
			</article>
		</EditorTemplate>
		: <article className={styles.error}>{error}</article>
}

export default TaskCategoriesEditor
