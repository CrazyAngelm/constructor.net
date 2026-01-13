import { useState } from 'react'

import { getUserById, updateScope, updateUser } from '@/lib/requests/users'
import { ApiError } from '@/lib/requests'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { ScopeEnum } from '@/lib/dto/users'

import editorStyles from '@/styles/adm/Editor.module.scss'
import styles from '@/styles/adm/editors/UserEditor.module.scss'

import EditorTemplate from '../EditorTemplate'
import Checkbox from '@/components/controls/Checkbox'
import Field from '@/components/controls/Fields'
import { getVersionById, updateVersion } from '@/lib/requests/version'
import DropdownCheck from '@/components/controls/DropdownCheck'
import Dropdown from '@/components/controls/Dropdown'
import { VersionType } from '@/lib/dto/versions'
import { changeHanderDtoString } from '@/lib/changeHandler'
import TextArea from '@/components/controls/TextArea'


export interface Props {
	id?: string
	callbackUpdate?: () => void
}

const VersionEditor = ({ id, callbackUpdate }: Props) => {
	const [ errorMsg, setError ] = useState<string | undefined>('')

	const { data, update, setData, error }
		= useFetchData(id as string, getVersionById)


	const save = () => {
		if (!id || !data) {
			setError('Error: id == undefined || data == undefined')
			return
		}
		updateVersion(id, data)
			.then(() => callbackUpdate && callbackUpdate())
			.catch((err) => {
				console.log(err)
				if (err instanceof ApiError) setError(() => err.message)
				else setError(JSON.stringify(err))
			})
	}

	return data
		? <EditorTemplate error={errorMsg} callbackSave={save} callbackUpdate={update}>
			<article className={`${styles.editor}`}>
				<Field label="id" value={data.id} isReadonly isHorizontal />
				<Field label="Версия" value={data.name} isHorizontal
					onChange={changeHanderDtoString('name', setData)} />
				<Field label="Путь" value={data.archive} isHorizontal
					onChange={changeHanderDtoString('archive', setData)} />
				<Dropdown label="Тип" value={data.type} list={VersionType.getList()}
					callbackChoise={changeHanderDtoString('type', setData)} isHorizontal />
				<TextArea label="О выпуске" value={data.notes}
					onChange={changeHanderDtoString('notes', setData)} />
			</article>
		</EditorTemplate>
		: <article className={editorStyles.error}>
			{error && 'Какая то ошибка'}
		</article>
}

export default VersionEditor
