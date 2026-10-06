
import { VersionType } from '@/lib/dto/versions'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { getVersions, updateVersion } from '@/lib/requests/version'
import styles from '@/styles/adm/Content.module.scss'
import { useState } from 'react'
import List from '../../List'
import ButtonsList from '../ButtonsList'
import VersionEditor from './VersionEditor'



const Versions = () => {
	const [ versionId, setVersionId ] = useState<string | undefined>(undefined)

	const { data, update, error } = useFetchData({}, getVersions)

	const createVersion = () => {
		updateVersion('-1', {
			id: '',
			name: '0.0.0',
			notes: 'Описание',
			type: VersionType.alpha,
			archive: 'https://',
		}).then((resp) => {
			setVersionId(resp.id)
			update()
		})
	}

	return (
		<article className={styles.content}>
			<section className={styles.list}>
				{!data && <p role="status">{error || 'Загружаем версии…'}</p>}
				{data
					&& <List name="Версии"
						length={data.length}
						rows={[ {
							header: 'Название',
							value: i => data[i]?.name as string,
						}, {
							header: 'Тип',
							value: i => data[i]?.type as string,
						} ]}
						callback={i => setVersionId(data[i]?.id)}
						selected={data.findIndex(p => p.id === versionId)} />
				}
				<ButtonsList callbackCreate={createVersion} />
			</section>
			<section className={styles.editor}>
				{!versionId && <p className={styles.empty}>Здесь управляются выпуски настольного приложения. Выберите версию в списке для просмотра.</p>}
				{versionId && <VersionEditor callbackUpdate={update} id={versionId} />}
			</section>
		</article >
	)
}
export default Versions
