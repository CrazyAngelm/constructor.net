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
import { makeFetcher } from '@/lib/fetchers'
import { getSubscription, unsubscribe } from '@/lib/requests/subscription'
import {Item} from '@/components/lk/Subscription'
import Modal from '@/components/controls/Modal'


export interface Props {
	id?: string
	callbackUpdate?: () => void
}

const UserEditor = ({ id, callbackUpdate }: Props) => {
	const [ errorMsg, setError ] = useState<string | undefined>('')
	const [ not, setNot ] = useState(false)


	const { data: user, update, setData: setUser, error } = useFetchData(id as string, getUserById)
	const { data: subscription, update: updateSubscription } = useFetchData({ id: user?.id },
		getSubscription);


	const cancelSubscription = async () => {
		if(!user || !subscription) return
		setNot(false)
		try {
			await makeFetcher(unsubscribe)({
				userId: user.id,
				subscriptionId: subscription[ 0 ]?.id
			})
		} catch (err) {
			console.log(err)
		}
		updateSubscription()

	}

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
			active: ScopeEnum.Contains(ScopeEnum.admin, user.scopes)
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
				<Modal closeCallback={() => setNot(false)}
					visible={not}>
					<section className={styles.notification}>
						<header>Внимание!</header>
						<div>Действие необратимо, при отмене подписки пользователь больше не сможете
							воспользоваться функционалом указанном в тарифе.<br />
							При новом подключении подписки сроки оплаты будут
							считаться с момента оплаты новой подписки <br />
						</div>
						<button onClick={cancelSubscription}>Все равно отменить подписку</button>
					</section>
				</Modal>
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
					<section>
						{(subscription && subscription.length > 0) &&
							<article className={styles.subscription}>
								{!subscription ?
									<div>Пока нет информации о подписках</div>
									:
									<>{subscription.map(p => <>
										<Item key={p.id} item={p} update={update} />
										<br />
										{/* <button onClick={() => setNot(true)}
											className={styles.danger}>
											Удалить подписку
										</button> */}
									</>)}

									</>
								}
							</article>
						}
					</section>
				</article>
			</article>
		</EditorTemplate>
		: <article className={editorStyles.error}>
			{error && 'Какая то ошибка'}
		</article>
}

export default UserEditor
