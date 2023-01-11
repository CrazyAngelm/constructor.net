import { Subscription } from '@/lib/dto/subscription'
import { makeFetcher } from '@/lib/fetchers'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { getLicenses, getSubscription, unsubscribe } from '@/lib/requests/subscription'
import { useSession } from '@/lib/session/hooks'
import styles from '@/styles/lk/Subscription.module.scss'
import { useState } from 'react'
import Modal from '../controls/Modal'

interface PropsItem {
	item: Subscription
}

const Item = ({ item }: PropsItem) => {
	const { data } = useFetchData({}, getLicenses)

	const license = data?.find(p => p.id == item.licenseId)


	return (
		<section className={styles.item}>
			<table>
				<tr >
					<td className={styles.header}>Тариф</td>
					<td>{license?.name}</td>
				</tr>
				<tr>
					<td className={styles.header}>Ежемесячная стоимость</td>
					<td>{license?.price} р.</td>
				</tr>
				<tr>
					<td className={styles.header}>Дата начала</td>
					<td>{new Date(item.startDate ?? Date()).toLocaleString('ru-RU', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}</td>
				</tr>
				<tr>
					<td className={styles.header}>Дата следующей оплаты</td>
					<td>{new Date(item.endDate ?? Date()).toLocaleString('ru-RU', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}</td>
				</tr>
			</table>
		</section>
	)
}

const Subscription = () => {
	const [ not, setNot ] = useState(false)

	const session = useSession()
	const { data, update } = useFetchData({ id: (session != 'loading') ? session?.user?.id : undefined },
		getSubscription);

	const cancelSubscription = async () => {
		if (session == 'loading' || !data) return
		setNot(false)

		try {
			await makeFetcher(unsubscribe)({
				userId: session?.user?.id,
				subscriptionId: data[ 0 ]?.id
			})
		} catch (err) {
			console.log(err)
		}
		update()

	}
	return (
		<>
			<Modal closeCallback={() => setNot(false)}
				visible={not}>
				<section className={styles.notification}>
					<header>Внимание!</header>
					<div>Действие необратимо, при отмене подписки вы больше не сможете
						воспользоваться функционалом указанном в тарифе.<br />
						При новом подключении подписки сроки оплаты будут
						считаться с момента оплаты новой подписки <br />
					</div>
					<button onClick={cancelSubscription}>Все равно отписаться</button>
				</section>
			</Modal>
			{data &&
				<article className={styles.subscription}>
					{!data ?
						<div>Пока нет информации о подписках</div>
						:
						<>{data.map(p => <Item key={p.id} item={p} />)}
							<button onClick={() => setNot(true)}>Отписаться</button>
						</>
					}
				</article>
			}
		</>
	)
}

export default Subscription
