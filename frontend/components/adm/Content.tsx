import styles from '@/styles/adm/Content.module.scss'
import { ReactNode } from 'react'
import CourseContent from './contents/course/CourseContent'
import Course from './contents/newCourse/Course'
import TaskContent from './contents/task/TaskContent'
import TaskCategoriesContent from './contents/taskCategories/TaskCategoriesContent'
import UserContent from './contents/user/UserContent'

export enum TypeContent {
	NewCourse,
	Users,
	Course,
	Categories,
	Tasks
}

export interface Props {
	type?: TypeContent
}

const getContent = (type?: TypeContent): ReactNode => {
	switch (type) {
		case TypeContent.Users: return <UserContent />
		case TypeContent.Course: return <CourseContent />
		case TypeContent.Categories: return <TaskCategoriesContent />
		case TypeContent.Tasks: return <TaskContent />
		case TypeContent.NewCourse: return <Course />
		default: return null
	}
}

const Content = ({ type }: Props) => {
	return (
		<article className={styles.content}>
			{getContent(type)}
		</article>
	)
}

export default Content
