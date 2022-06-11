import { useState } from 'react'
import Image from 'next/image'

import { useFetchData } from '@/lib/hooks/useFetchData'
import { getCourses, getTaskCategories } from '@/lib/requests/tasks'

import styles from '@/styles/adm/Content.module.scss'

import back from '@/assets/back.svg'

import List from '../../List'
import ButtonsList from '../ButtonsList'
import TaskCategoriesEditor from '../taskCategories/TaskCategoriesEditor'

import TaskEditor from '../task/TaskEditor'
import CourseEditor from './CourseEditor'


const CourseContent = () => {
	const [ courseId, setCourseId ] = useState<number | undefined>(undefined)
	const [ taskId, setTaskId ] = useState<number | undefined>(undefined)

	const { data, error, update } = useFetchData({}, getCourses)

	return (
		<article className={styles.content}>
			<section className={styles.list}>
				{data &&
					<List name='Курсы'
						length={data.length}
						rows={[ {
							header: 'id',
							value: i => data[ i ]?.id.toString() as string,
						}, {
							header: 'Название',
							value: i => data[ i ]?.name as string
						} ]}
						callback={i => setCourseId(() => data[ i ]?.id)}
						selected={data.findIndex(p => p.id == courseId)} />
				}
				<ButtonsList callbackCreate={() => setCourseId(() => -1)} />
			</section>
			<section className={styles.editor}>
				{courseId &&
					<CourseEditor callbackBack={() => setCourseId(undefined)}
						callbackUpdate={update} id={courseId} />}
			</section>
		</article >
	)
}

export default CourseContent
