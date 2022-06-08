import { ScopeEnum, UserDto } from '@/lib/dto/users'
import Checkbox from '@/components/controls/Checkbox'
import Field from '@/components/controls/Fields'
import { makeFetcher } from '@/lib/fetchers'
import { getUserById } from '@/lib/requests/users'
import editorStyles from '@/styles/adm/Editor.module.scss'
import styles from '@/styles/adm/editors/UserEditor.module.scss'
import useSWR from 'swr'
import { useEffect, useState } from 'react'

export interface Props {
	id?: string
}

const UserEditor = ({ id }: Props) => {
	const [ user, setUser ] = useState<UserDto>()
	const { data, error } = useSWR(id, makeFetcher(getUserById))

	useEffect(() => {
		setUser(() => data)
	}, [ data ])

	const onChangeScope = (scope: string): ((value: boolean) => void) => {
		return (v) => {
			console.log(v)
			setUser(u => {
				if (!u) return u
				const index = u?.scopes?.indexOf(scope)
				if (v && index < 0) u?.scopes?.push(scope)
				if (!v && index > -1) u?.scopes?.splice(index, 1)
				return { ...u }
			})
		}
	}

	return user
		? <article className={`${editorStyles.editor} ${styles.editor}`}>
			<section>
				<img className={styles.avatar} src={user.image} />
				<div>
					<Field isHorizontal={true} label='id' type='text' value={user.id} isReadonly />
					<Field isHorizontal label='Имя' type='text' value={user.name} />
					<Field isHorizontal label='email' type='email' value={user.email} />
				</div>
			</section>
			<section>
				<Checkbox isHorizontal label='admin'
					value={ScopeEnum.Contains(ScopeEnum.admin, user.scopes)}
					onChange={onChangeScope(ScopeEnum.admin)} />
				<Checkbox isHorizontal label='editor'
					value={ScopeEnum.Contains(ScopeEnum.editor, user.scopes)}
					onChange={onChangeScope(ScopeEnum.editor)} />
			</section>
		</article>
		: <article className={editorStyles.error}>
			{error && 'Какая то ошибка'}
		</article>
}

export default UserEditor
