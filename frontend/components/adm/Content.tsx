import styles from '@/styles/adm/Content.module.scss'
import { ReactNode } from 'react'
import TaskContent from './contents/task/TaskContent'
import TaskCategoriesContent from './contents/taskCategories/TaskCategoriesContent'
import UserContent from './contents/user/UserContent'

export enum TypeContent {
	Users,
	Categories,
	Tasks
}

export interface Props {
	type?: TypeContent
}

const getContent = (type?: TypeContent): ReactNode => {
	switch (type) {
		case TypeContent.Users: return <UserContent />
		case TypeContent.Categories: return <TaskCategoriesContent />
		case TypeContent.Tasks: return <TaskContent />
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
