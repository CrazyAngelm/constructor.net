import { ReactNode } from 'react'

import styles from '@/styles/adm/Content.module.scss'

import Hierarchy from './contents/hierarchy/Hierarchy'
import UserContent from './contents/user/UserContent'

export enum TypeContent {
	HierarchyContent,
	Users,
}

export interface Props {
	type?: TypeContent
}

const getContent = (type?: TypeContent): ReactNode => {
	switch (type) {
		case TypeContent.Users: return <UserContent />
		case TypeContent.HierarchyContent: return <Hierarchy />
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
