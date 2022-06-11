import { useState } from 'react'

import { useFetchData } from '@/lib/hooks/useFetchData'
import { getTaskCategories } from '@/lib/requests/tasks'

import styles from '@/styles/adm/Content.module.scss'

import List from '../../List'
import ButtonsList from '../ButtonsList'
import TaskCategoriesEditor from './TaskCategoriesEditor'

import TaskEditor from '../task/TaskEditor'


const TaskCategoriesContent = () => {
	const [ categoryId, setCategoryId ] = useState<number | undefined>(undefined)

	const { data, error, update } = useFetchData({}, getTaskCategories)

	return (
		<article className={styles.content}>
			<section className={styles.list}>
				{data &&
					<List name='Категории'
						length={data.length}
						rows={[ {
							header: 'id',
							value: i => data[ i ]?.id.toString() as string,
						}, {
							header: 'Название',
							value: i => data[ i ]?.name as string
						} ]}
						callback={i => setCategoryId(() => data[ i ]?.id)}
						selected={data.findIndex(p => p.id == categoryId)} />
				}
				<ButtonsList callbackCreate={() => setCategoryId(() => -1)} />
			</section>
			<section className={styles.editor}>
				{categoryId &&
					<TaskCategoriesEditor callbackBack={() => setCategoryId(undefined)}
						callbackUpdate={update} id={categoryId} />}
			</section>
		</article >
	)
}

export default TaskCategoriesContent
