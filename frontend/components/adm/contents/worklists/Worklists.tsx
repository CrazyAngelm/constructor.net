import { TaskCategoryDto } from '@/lib/dto/tasks'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { getCourses, getTaskCategoriesByIdCategory, getTaskCategoriesByIdCourse } from '@/lib/requests/tasks'
import styles from '@/styles/adm/Content.module.scss'
import { useState } from 'react'
import arrow from '@/assets/back.svg'
import Image from 'next/image'
import WorklistsEditor from './WorklistEditor'


interface PropsItem {
	category: TaskCategoryDto
	isCourse?: boolean
	selectCallback: (manual: TaskCategoryDto, isCourse?: boolean) => void
}

const Item = ({ category, selectCallback, isCourse }: PropsItem) => {
	const [ open, setOpen ] = useState(false)

	const { data } = useFetchData(category.id, isCourse
		? getTaskCategoriesByIdCourse
		: getTaskCategoriesByIdCategory)

	const isOpen = (): boolean => data != null && data.length != 0

	return (
		<div className={styles.item}>
			<header>
				<div onClick={() => setOpen(p => !p)}>
					{isOpen()
						&& <div className={`${styles.arrow} ${open && styles.open}`}>
							<Image src={arrow} />
						</div>}
				</div>
				<span onClick={() => selectCallback(category, isCourse)}>
					{category.name}
				</span>
			</header>

			{open
				&& <section>
					{data?.map(p => <Item key={p.id}
						category={p} selectCallback={selectCallback} />)}
				</section>
			}
		</div>
	)
}


const Worklists = () => {
	const [ selectedCategory, setSelectedCategory ] = useState<TaskCategoryDto | undefined>()
	const [ isCourseSelected, setIsCourseSelected ] = useState<boolean>()
	const { data } = useFetchData({}, getCourses)

	const selectCategory = (category?: TaskCategoryDto, isCourse?: boolean) => {
		setSelectedCategory(category)
		setIsCourseSelected(isCourse)
	}

	return (
		<article className={styles.content}>
			<section className={styles.list}>
				{data?.map(p => <Item key={p.id} category={p}
					isCourse
					selectCallback={selectCategory} />)}
			</section>
			<section className={styles.editor}>
				{selectedCategory
					&& <WorklistsEditor callbackBack={() => selectCategory(undefined)}
						isCourse={isCourseSelected}
						category={selectedCategory} />
				}
			</section>
		</article>
	)
}

export default Worklists
