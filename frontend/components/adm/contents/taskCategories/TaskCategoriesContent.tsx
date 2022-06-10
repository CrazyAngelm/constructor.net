import { useState } from 'react'
import Image from 'next/image'

import { useFetchData } from '@/lib/hooks/useFetchData'
import { getTaskCategories } from '@/lib/requests/tasks'

import styles from '@/styles/adm/Content.module.scss'

import back from '@/assets/back.svg'

import List from '../../List'
import ButtonsList from '../ButtonsList'
import TaskCategoriesEditor from './TaskCategoriesEditor'

import TaskEditor from '../task/TaskEditor'


const TaskCategoriesContent = () => {
	const [ categoryId, setCategoryId ] = useState<number | undefined>(undefined)
	const [ taskId, setTaskId ] = useState<number | undefined>(undefined)

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
						callback={i => setCategoryId(data[ i ]?.id)}
						selected={data.findIndex(p => p.id == categoryId)} />
				}
				<ButtonsList callbackCreate={() => setCategoryId(-1)} />
			</section>
			<section className={styles.editor}>
				<div onClick={() => setTaskId(undefined)} className={`${taskId ? styles.back : styles.hide}`}>
					<Image src={back} layout='fill' objectFit='contain' />
				</div>
				{taskId
					? <TaskEditor categoryId={categoryId} id={taskId} />
					: categoryId &&
					<TaskCategoriesEditor callbackUpdate={update} callbackSelectTask={id => setTaskId(id)} id={categoryId} />}
			</section>
		</article >
	)
}

export default TaskCategoriesContent
