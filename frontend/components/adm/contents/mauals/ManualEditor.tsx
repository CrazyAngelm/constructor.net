import { useState } from 'react'

import { changeHanderDtoString } from '@/lib/changeHandler'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { handleErrorTsx } from '@/lib/requests'
import styles from '@/styles/adm/editors/Task.module.scss'

import Field from '@/components/controls/Fields'
import EditorTemplate, { Notification } from '../EditorTemplate'
import { getManualById, removeManual, updateManual } from '@/lib/requests/manuals'
import dynamic from 'next/dynamic'
import { sanitizeManualHtml } from '@/lib/manuals/sanitize'


export interface Props {
	id: number
	callbackUpdate?: () => void
	callbackBack?: () => void
}

const ManualEditor = ({ id, callbackUpdate, callbackBack }: Props) => {
	const [ errorMsg, setError ] = useState<string | undefined>('')
	const [ notification, setNotification ] = useState<Notification>()
	const { data, update, setData, error } = useFetchData(id, getManualById)


	const save = () => {
		if (!data) {
			setError('Error: id == undefined || user == undefined')
			return
		}
		updateManual(data.id, data)
			.then((resp) => {
				setNotification(() => { return { color: 'sucess', msg: 'Сохранено' } as Notification })
				callbackUpdate && callbackUpdate()
			})
			.catch(err => handleErrorTsx(err, setError))
	}

	const remove = () => {
		removeManual(id)
			.then(() => {
				callbackUpdate && callbackUpdate()
				callbackBack && callbackBack()
			})
			.catch(err => handleErrorTsx(err, setError))
	}

	return <EditorTemplate callbackBack={callbackBack} callbackRemove={remove} notification={notification}
		callbackSave={save} callbackUpdate={update} error={errorMsg}>
		{data
			? <article className={styles.editor}>
				<Field isHorizontal label="id" type="text" value={data.id.toString()} isReadonly />
				<Field onChange={changeHanderDtoString('name', setData)}
					isHorizontal label="Название" type="text" value={data.name} />
				<details className={styles.sourceEditor}><summary>Редактировать HTML</summary><label className={styles.manualEditorLabel}>
					<span>Содержимое методички (HTML)</span>
					<textarea
						className={styles.manualHtmlEditor}
						value={data.html ?? ''}
						onChange={(event) => changeHanderDtoString('html', setData)(event.currentTarget.value)}
						spellCheck={false}
					/>
				</label></details>
				<section className={styles.manualPreview} aria-label="Предпросмотр методички">
					<div dangerouslySetInnerHTML={{ __html: sanitizeManualHtml(data.html ?? '') }} />
				</section>
			</article>
			: <article>{error || 'Загружаем руководство…'}</article>}
	</EditorTemplate>
}

export default dynamic(() => Promise.resolve(ManualEditor), { ssr: false })
