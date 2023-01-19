import { Subscription } from '@/lib/dto/subscription'
import { makeFetcher } from '@/lib/fetchers'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { changePaymentMethod, getLicenses, getSubscription, resetPaymentMethod, unsubscribe } from '@/lib/requests/subscription'
import { useSession } from '@/lib/session/hooks'
import { YooCheckoutWidget } from '@/lib/YooCheckoutWidget'
import styles from '@/styles/lk/Subscription.module.scss'
import Head from 'next/head'
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
				<tr>
					<td className={styles.header}>Активна</td>
					<td>{item.active ? 'Да' : 'Нет'}</td>
				</tr>
				<tr>
					<td className={styles.header}>Способ оплаты</td>
					<td>{item.paymentTitle ?
						item.paymentTitle
						: 'Способ оплаты не привязан'}</td>
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

	const resetPayment = async () => {
		if (session == 'loading' || !data || data.length === 0) return;

		await makeFetcher(resetPaymentMethod)({
			userId: session?.user?.id,
			subscriptionId: data[ 0 ]?.id
		})

		update()
	}

	const changePayment = async () => {
		if (session == 'loading' || !data || data.length === 0) return;

		const res = await makeFetcher(changePaymentMethod)({
			userId: session?.user?.id,
			subscriptionId: data[ 0 ]?.id
		})

		YooCheckoutWidget(res.confirmationToken,
			res.returnUrl + '/lk',
			(err) => console.log(err))
	}

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
			<Head>
				<script src="https://yookassa.ru/checkout-widget/v1/checkout-widget.js"></script>
			</Head>
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
			{(data && data.length > 0) &&
				<article className={styles.subscription}>
					{!data ?
						<div>Пока нет информации о подписках</div>
						:
						<>{data.map(p => <>
							<Item key={p.id} item={p} />
							{p.paymentTitle &&
								<button onClick={resetPayment}>отвязать способ оплаты</button>
							}
							<button onClick={changePayment}>привязать способ оплаты</button>
							<br />
							<button onClick={() => setNot(true)}
								className={styles.danger}>
								Отписаться
							</button>
						</>)}

						</>
					}
				</article>
			}
		</>
	)
}

export default Subscription
