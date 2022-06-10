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


export interface Props {
	id?: string
	callbackUpdate?: () => void
}

const UserEditor = ({ id, callbackUpdate }: Props) => {
	const [ errorMsg, setError ] = useState<string | undefined>('')

	const { data: user, update, setData: setUser, error } = useFetchData(id as string, getUserById)


	const save = () => {
		if (!id || !user) {
			setError('Error: id == undefined || user == undefined')
			return
		}
		updateUser(id, user)
			.then(() => callbackUpdate && callbackUpdate())
			.catch(err => {
				console.log(err)
				if (err instanceof ApiError) setError(() => err.message)
				else setError(JSON.stringify(err))
			})
		updateScope(id, {
			scope: ScopeEnum.admin,
			active: ScopeEnum.Contains(ScopeEnum.admin,user.scopes)
		})
		updateScope(id, {
			scope: ScopeEnum.editor,
			active: ScopeEnum.Contains(ScopeEnum.editor, user.scopes)
		})
	}

	const onChangeScope = (scope: string): ((value: boolean) => void) => {
		return (v) => {
			console.log(v)
			setUser(u => {
				if (!u || !u.scopes) return u
				const index = u?.scopes?.indexOf(scope)
				if (v && index < 0) u?.scopes?.push(scope)
				if (!v && index > -1) u?.scopes?.splice(index, 1)
				return { ...u }
			})
		}
	}
	const changeHandler = (field: 'name' | 'email'): ((value: string) => void) => {
		return v => {
			setUser(u => {
				if (!u) return u
				u[ field ] = v
				return { ...u }
			})
		}
	}

	return user
		? <EditorTemplate error={errorMsg} callbackSave={save} callbackUpdate={update}>
			<article className={`${styles.editor}`}>
				<article>
					<section>
						<img className={styles.avatar} src={user.image} />
						<div>
							<Field isHorizontal={true} label='id' type='text' value={user.id} isReadonly />
							<Field onChange={changeHandler('name')}
								isHorizontal label='Имя' type='text' value={user.name} />
							<Field onChange={changeHandler('email')}
								isHorizontal label='email' type='email' value={user.email} />
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
			</article>
		</EditorTemplate>
		: <article className={editorStyles.error}>
			{error && 'Какая то ошибка'}
		</article>
}

export default UserEditor
