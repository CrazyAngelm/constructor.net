import styles from '@/styles/controls/Upload.module.scss'
import { ChangeEvent, useState } from 'react'
import Loader from './Loader'

export interface Props {
	onChange?: (file: File | undefined) => void
	preview?: boolean
}


const Upload = ({ onChange }: Props) => {
	const [ file, setFile ] = useState<File>()
	const [ imgPreview, setImgPreview ] = useState<string | undefined>()




	const changeHandler = (v: ChangeEvent<HTMLInputElement>) => {
		if (!v.target.files || v.target.files.length === 0) return
		const f = v.target.files[ 0 ]
		setFile(f)
		const reader = new FileReader()
		setImgPreview(undefined)
		reader.readAsDataURL(f as Blob)
		reader.onload = ev => {
			setImgPreview(ev.target?.result as string | undefined)
		}
		onChange && onChange(f)
	}

	return (
		<section className={styles.upload}>
			{file &&
				<img src={imgPreview} />}
			<div className="file has-name">
				<label className="file-label">
					<input onChange={changeHandler} className="file-input"
						type="file" name="resume" accept=".jpg, .png" />
					<span className="file-cta">
						<span className="file-icon">
							{(file && !imgPreview) &&
								<Loader className={styles.loader} />
							}
							<i className="fas fa-upload"></i>
						</span>
						<span className="file-label">
							Choose a file…
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
