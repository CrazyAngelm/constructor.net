import { NextPage } from 'next'

import { withAdminSession } from '@/lib/session/withSession'

import styles from '@/styles/adm/index.module.scss'

import Menu, { Categories } from '@/components/adm/Menu'
import Layout from '@/components/Layout'
import Content, { TypeContent } from '@/components/adm/Content'
import { useState } from 'react'


const Adm: NextPage = () => {
	const [ typeContent, setType ] = useState<TypeContent>(TypeContent.Visibility)

	const categories = [
		{
			label: 'Сайт',
			items: [ {
				label: 'Пользователи',
				callback: () => setType(TypeContent.Users),
			} ],
		}, {
			label: 'Контент',
			items: [ {
				label: 'Курсы',
				callback: () => setType(TypeContent.HierarchyContent),
			}, {
				label: 'Видимость каталога',
				callback: () => setType(TypeContent.Visibility),
			}, {
				label: 'Методички',
				callback: () => setType(TypeContent.Manual),
			} ],
		}, {
			label: 'Приложение',
			items: [ {
				label: 'Версии',
				callback: () => setType(TypeContent.Versions),
			} ],
		},
	] as Categories[]

	return (
		<Layout title="Администрирование" footer={false} >
			<article className={styles.adm}>
				<Menu categories={categories} activeLabel={{ [TypeContent.Users]: 'Пользователи', [TypeContent.HierarchyContent]: 'Курсы', [TypeContent.Visibility]: 'Видимость каталога', [TypeContent.Manual]: 'Методички', [TypeContent.Versions]: 'Версии', [TypeContent.Worklists]: 'Конспекты' }[typeContent]} />
				<div className={styles.content}>
					<Content type={typeContent} />
				</div>
			</article>
		</Layout >
	)
}

export default Adm

export const getServerSideProps = withAdminSession((session) => {
	return {
		props: {},
	}
})
