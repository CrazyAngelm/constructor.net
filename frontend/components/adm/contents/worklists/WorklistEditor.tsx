import { TaskCategoryDto } from "@/lib/dto/tasks"
import EditorTemplate from "../EditorTemplate"
import styles from '@/styles/adm/editors/TaskCategory.module.scss'
import { useFetchData } from "@/lib/hooks/useFetchData"
import { getWorklistsByIdCategory, getWorklistsByIdCourse } from "@/lib/requests/worklists"
import { WorklistDto } from "@/lib/dto/worklist"

interface PropsItem {
	worklist: WorklistDto
}

const Item = ({ worklist }: PropsItem) => {
	return (
		<article>
			{worklist.name}
		</article>
	)
}

interface Props {
	category: TaskCategoryDto
	isCourse?: boolean
	callbackBack: () => void
}

const WorklistsEditor = ({ category, isCourse, callbackBack }: Props) => {

	const { data } = useFetchData(category.id, isCourse
		? getWorklistsByIdCourse
		: getWorklistsByIdCategory)

	return (
		<EditorTemplate callbackBack={callbackBack}>
			<article className={`${styles.editor} ${styles.withList}`}>
				<header>
					{category.name}
				</header>
				<section>
					{data && data.length == 0 &&
						<span>Нет загруженных конпсектов в этой категории</span>}
					{data?.map(p => <Item worklist={p} />)}
				</section>
			</article>

		</EditorTemplate>
	)
}

export default WorklistsEditor
