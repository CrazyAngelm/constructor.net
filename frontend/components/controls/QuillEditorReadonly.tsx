import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import ReactQuill from 'react-quill'

const modules = {
	toolbar: null
}
//#endregion


export interface Props {
	value?: string
}

const QuillEditorReadonly = ({ value }: Props) => {
	return (
		<article>
			<ReactQuill
				modules={modules} theme={undefined} value={value}
				readOnly={true} />
		</article>
	)
}

export default dynamic(() => Promise.resolve(QuillEditorReadonly), { ssr: false })


