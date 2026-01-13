import { ComponentClass, FunctionComponent, useState, ComponentProps } from 'react'

import { changeHanderDtoString } from '@/lib/changeHandler'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { handleErrorTsx } from '@/lib/requests'
import {
	getTaskById, getTaskCategories, getTaskCategoryById, removeTask,
	updateTask, uploadTaskImage,
} from '@/lib/requests/tasks'

import styles from '@/styles/adm/editors/Task.module.scss'

import DropdownCheck from '@/components/controls/DropdownCheck'
import Field from '@/components/controls/Fields'
import TextArea from '@/components/controls/TextArea'
import Upload from '@/components/controls/Upload'
import EditorTemplate, { Notification } from '../EditorTemplate'
import { makeFetcher } from '@/lib/fetchers'
import { getManualById, removeManual, updateManual } from '@/lib/requests/manuals'
import dynamic, { DynamicOptions } from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import { ImageResize } from 'quill-image-resize-module-ts'
import ReactQuill from 'react-quill'
import { Quill } from 'react-quill'

Quill.register('modules/imageResize', ImageResize)


const modules = {
	toolbar: [
		[ { 'size': [ 'small', false, 'large', 'huge' ] },  // custom dropdown
			{ 'header': [ 1, 2, 3, 4, 5, 6, false ] },
			{ 'font': [] }, { 'align': [] } ],

		[ 'bold', 'italic', 'underline', 'strike' ],        // toggled buttons
		[ 'blockquote', 'code-block' ],

		[ { 'list': 'ordered' }, { 'list': 'bullet' } ],
		[ { 'script': 'sub' }, { 'script': 'super' } ],      // superscript/subscript
		[ { 'indent': '-1' }, { 'indent': '+1' } ],          // outdent/indent
		[ { 'direction': 'rtl' } ],                         // text direction

		[ { 'color': [] }, { 'background': [] } ],          // dropdown with defaults from theme


		[ 'video', 'image' ],
	],
	imageResize: {
		modules: [ 'Resize', 'DisplaySize', 'Toolbar' ],
		// See optional "config" below
	},
}

const formats = [
	'header',
	'bold', 'italic', 'underline', 'strike', 'blockquote',
	'list', 'bullet', 'indent',
	'link', 'image',
]
//#endregion


export interface Props {
	id: number
	callbackUpdate?: () => void
	callbackBack?: () => void
}

const ManualEditor = ({ id, callbackUpdate, callbackBack }: Props) => {
	const [ errorMsg, setError ] = useState<string | undefined>('')
	const [ notification, setNotification ] = useState<Notification>()
	const [ loaded, setLoaded ] = useState(false)
	const [ html, setHtml ] = useState('')

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
				<ReactQuill className={styles.quillEditor}
					modules={modules} theme="snow" value={data.html}
					onChange={changeHanderDtoString('html', setData)} />
			</article>
			: <article>Error: {error}</article>}
	</EditorTemplate>
}

export default dynamic(() => Promise.resolve(ManualEditor), { ssr: false })


