import { useState } from 'react'
import Image from 'next/image'

import { useFetchData } from '@/lib/hooks/useFetchData'
import { getTaskCategories, getTasks } from '@/lib/requests/tasks'

import styles from '@/styles/adm/Content.module.scss'

import back from '@/assets/back.svg'

import List from '../../List'
import ButtonsList from '../ButtonsList'
import TaskEditor from './TaskEditor'


const TaskContent = () => {
	const [ taskId, setTaskId ] = useState<number | undefined>(undefined)

	const { data, error, update } = useFetchData({}, getTasks)

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
						callback={i => setTaskId(() => data[ i ]?.id)}
						selected={data.findIndex(p => p.id == taskId)} />
				}
				<ButtonsList callbackCreate={() => setTaskId(() => -1)} />
			</section>
			<section className={styles.editor}>
				{taskId &&
					<TaskEditor callbackBack={() => setTaskId(undefined)} callbackUpdate={update} id={taskId} />}
			</section>
		</article >
	)
}

export default TaskContent
