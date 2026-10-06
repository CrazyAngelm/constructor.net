import styles from '@/styles/controls/Upload.module.scss'
import { ChangeEvent, useEffect, useState } from 'react'
import Loader from './Loader'

export interface Props {
	onChange?: (file: FormData | undefined) => void
	preview?: boolean
	value?: string
	keyChange?: string
}


const Upload = ({ onChange, value, preview, keyChange }: Props) => {
	const [ file, setFile ] = useState<File>()
	const [ imgPreview, setImgPreview ] = useState<string | undefined>()
	const [ lastKeyChange, setLastKeyChange ] = useState<string | undefined>('key')

	useEffect(() => {
		if (lastKeyChange !== keyChange) {
			setImgPreview(() => undefined)
			setLastKeyChange(keyChange)
			setTimeout(() => setImgPreview(() => value), 10)
		}
	}, [ value ])

	useEffect(() => {
		console.log(value)
		setFile(undefined)
		setImgPreview(value)
	}, [ keyChange ])


	const changeHandler = (v: ChangeEvent<HTMLInputElement>) => {
		if (!v.target.files || v.target.files.length === 0) return
		const f = v.target.files[0]
		setFile(f)
		const reader = new FileReader()
		setImgPreview(undefined)
		reader.readAsDataURL(f as Blob)
		reader.onload = (ev) => {
			setImgPreview(ev.target?.result as string | undefined)
		}
		const formData = new FormData()
		formData.append('file', f as Blob)
		onChange && onChange(formData)
	}

	return (
		<section className={styles.upload}>
			{(preview && imgPreview)
				&& <img src={imgPreview} alt="Изображение задания" />}
			<div className="file has-name">
				<label className="file-label">
					<input onChange={changeHandler} className="file-input"
						type="file" name="resume" accept=".jpg, .png" />
					<span className="file-cta">
						<span className="file-icon">
							{(file && !imgPreview)
								&& <Loader className={styles.loader} />
							}
							<i className="fas fa-upload"></i>
						</span>
						<span className="file-label">
							Выбрать изображение
						</span>
					</span>
					<span className={`${styles.name} file-name`}>
						{file?.name}
					</span>
				</label>
			</div>
		</section>
	)
}

export default Upload
