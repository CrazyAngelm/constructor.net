import { useState } from 'react'

import { useFetchData } from '@/lib/hooks/useFetchData'
import { getUsers } from '@/lib/requests/users'

import styles from '@/styles/adm/Content.module.scss'

import List from '../../List'
import ButtonsList from '../ButtonsList'
import UserEditor from './UserEditor'

const UserContent = () => {
	const [ userId, setUserId ] = useState<string | null | undefined>(null)

	const { data, error, update } = useFetchData({}, getUsers)

	return (
		<article className={styles.content}>
			<section className={styles.list}>
				{data
					&& <List name="Пользователи"
						length={data.length}
						rows={[ {
							header: 'id',
							value: i => data[i]?.id as string,
						}, {
							header: 'name',
							value: i => data[i]?.name as string,
						} ]}
						callback={i => setUserId(data[i]?.id)}
						selected={data.findIndex(p => p.id === userId)} />
				}
				<ButtonsList />
			</section>
			<section className={styles.editor}>
				{userId && <UserEditor callbackUpdate={update} id={userId} />}
			</section>
		</article >
	)
}

export default UserContent
