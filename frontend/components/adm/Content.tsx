import { ReactNode } from 'react'

import styles from '@/styles/adm/Content.module.scss'

import Hierarchy from './contents/hierarchy/Hierarchy'
import UserContent from './contents/user/UserContent'
import Manual from './contents/mauals/Manual'

export enum TypeContent {
	HierarchyContent,
	Users,
	Manual
}

export interface Props {
	type?: TypeContent
}

const getContent = (type?: TypeContent): ReactNode => {
	switch (type) {
		case TypeContent.Users: return <UserContent />
		case TypeContent.HierarchyContent: return <Hierarchy />
		case TypeContent.Manual: return <Manual />
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
