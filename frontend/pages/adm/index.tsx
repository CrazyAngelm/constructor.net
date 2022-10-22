import { NextPage } from 'next';

import { withAdminSession } from '@/lib/session/withSession';

import styles from '@/styles/adm/index.module.scss'

import Menu, { Categories } from '@/components/adm/Menu';
import Layout from '@/components/Layout';
import Content, { TypeContent } from '@/components/adm/Content';
import { useState } from 'react';


const Adm: NextPage = () => {
	const [ typeContent, setType ] = useState<TypeContent>()

	const categories = [
		{
			label: 'Сайт',
			items: [ {
				label: 'Пользователи',
				callback: () => setType(TypeContent.Users)
			}, ]
		}, {
			label: 'Контент',
			items: [ {
				label: 'Иерархия',
				callback: () => setType(TypeContent.NewCourse)
				}, {
					label: 'Курсы',
					callback: () => setType(TypeContent.Course),
					items: [ {
						label: 'Категории',
						callback: () => setType(TypeContent.Categories)
					}, {
						label: 'Задания',
						callback: () => setType(TypeContent.Tasks)
					} ]
				} ]
			}
			] as Categories[]

	return(
		<Layout navbar = { false} >
					<article className={styles.adm}>
						<Menu categories={categories} />
						<div className={styles.content}>
							<Content type={typeContent} />
						</div>
					</article>
		</Layout >
	)
}

export default Adm

export const getServerSideProps = withAdminSession(session => {
	console.log(session)
	return {
		props: {}
	}
})


/*
-Content
	смысл такой, выбираем в меню ссылку и по каллбеку открывается
	контент собственно с нужной штукой (можно даже енумом)
	Далее уже идет запрос (либо там же, либо отправляем запросы в лист и едитор
		Лучше туда отправить, чтоб сразу и редактичровать и получать и обновлять по тем запросам)

	-List
		Список каких то данных
		Передавать внутрь массив и каллбеки
	-Editor
		окно редактора какой то инфы
		-IndividulaEditor
			Для каждого типа инфы свой редактор


*/
