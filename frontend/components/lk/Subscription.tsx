import { LicenseDto, Subscription } from '@/lib/dto/subscription'
import { CourseDto } from '@/lib/dto/tasks'
import { makeFetcher } from '@/lib/fetchers'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { changeCourses, changePaymentMethod, getLicenses, getSubscription, resetPaymentMethod, unsubscribe } from '@/lib/requests/subscription'
import { getCourses } from '@/lib/requests/tasks'
import { useSession } from '@/lib/session/hooks'
import { YooCheckoutWidget } from '@/lib/YooCheckoutWidget'
import styles from '@/styles/lk/Subscription.module.scss'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import Checkbox from '../controls/Checkbox'
import Modal from '../controls/Modal'

interface ChangeCoursesProps {
	license?: LicenseDto,
	subscription?: Subscription,
	update?: () => void
}

const ChangeCourse = ({ license, subscription, update }: ChangeCoursesProps) => {
	const [ visible, setVisible ] = useState<boolean>(false)
	const [ checkedCourses, setCheckedCourses ] = useState<boolean[]>()

	const { data } = useFetchData({}, getCourses)

	useEffect(() => {
		setCheckedCourses(data?.map(p => subscriptionCourses.indexOf(p.id) > -1 ? true : false))
	}, [ data ])

	const licenseCourses = license?.courses ? JSON.parse(license?.courses) as number[] : []
	const subscriptionCourses = subscription?.courses ? JSON.parse(subscription.courses) as number[] : []

	const onChange = (index: number, value: boolean) => {
		if (!data || !checkedCourses || !license?.freeCourses) return

		if (checkedCourses?.filter(p => p === true).length >= license?.freeCourses
			&& value)
			return

		setCheckedCourses((p) => {
			if (!p) return p
			p[index] = value
			return [ ...p ]
		})
	}

	const apply = async () => {

		await makeFetcher(changeCourses)({
			userId: subscription?.userId,
			coursesId: data?.filter((p, i) => checkedCourses && checkedCourses[i])
				.map(p => p.id),
		})

		update && update()
		setVisible(false)
	}
	return <article className={styles.changeCourses}>
		<Modal visible={visible} closeCallback={() => setVisible(false)}>
			<header>{checkedCourses?.filter(p => p === true).length}/
				{(license?.freeCourses && data) && license.freeCourses < data.length
					? license?.freeCourses : data?.length} курсов выбрано</header>
			{data?.map((p, id) => <section key={p.id} className={styles.courses}>
				<Checkbox value={licenseCourses.indexOf(p.id) !== -1
					? true
					: checkedCourses ? checkedCourses[id] : false
				}
				disabled={licenseCourses.indexOf(p.id) !== -1}
				onChange={v => onChange(id, v)} />
				<p>{p.name}</p>
			</section>)}
			<button onClick={apply}>Применить</button>
		</Modal>
		<button onClick={() => setVisible(true)}>
			Сменить доступные курсы
		</button>
	</article>
}

interface PropsItem {
	item: Subscription
	update?: () => void
}

export const Item = ({ item, update }: PropsItem) => {

	const { data } = useFetchData({}, getLicenses)
	const { data: courses } = useFetchData({}, getCourses)

	const license = data?.find(p => p.id == item.licenseId)

	const getAvialableCourses = (): CourseDto[] => {
		const licenseCourses = license?.courses ? JSON.parse(license?.courses) as number[] : []
		const subscriptionCourses = item.courses ? JSON.parse(item.courses) as number[] : []

		const ids = [ ...licenseCourses, ...subscriptionCourses ]
		return courses?.filter(p => ids.indexOf(p.id) > -1) ?? []
	}
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
						day: 'numeric',
					})}</td>
				</tr>
				<tr>
					<td className={styles.header}>
						{license?.price === 0
							? <>Дата окончания</>
							: <> Дата следующей оплаты</>
						}</td>
					<td>{new Date(item.endDate ?? Date()).toLocaleString('ru-RU', {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
					})}</td>
				</tr>
				<tr>
					<td className={styles.header}>Активна</td>
					<td>{item.active ? 'Да'
						: 'Нет. Оплата не прошла, для возобновления отмените и подпишитесь заново'}</td>
				</tr>
				{license?.price !== 0
					&& <tr>
						<td className={styles.header}>Способ оплаты</td>
						<td>{item.paymentTitle
							? item.paymentTitle
							: 'Способ оплаты не привязан'}</td>
					</tr>
				}
				<tr>
					<td className={styles.header}>Доступные курсы</td>
					<td>
						<section>
							{getAvialableCourses().map(p => <div>{p.name}<br /></div>)}
							<ChangeCourse subscription={item} license={license}
								update={update} />
						</section>
					</td>
				</tr>
			</table>
		</section>
	)
}

const Subscriptions = () => {
	const [ not, setNot ] = useState(false)

	const session = useSession()
	const { data, update } = useFetchData({ id: (session != 'loading') ? session?.user?.id : undefined },
		getSubscription)

	const resetPayment = async () => {
		if (session == 'loading' || !data || data.length === 0) return

		await makeFetcher(resetPaymentMethod)({
			userId: session?.user?.id,
			subscriptionId: data[0]?.id,
		})

		update()
	}

	const changePayment = async () => {
		if (session == 'loading' || !data || data.length === 0) return

		const res = await makeFetcher(changePaymentMethod)({
			userId: session?.user?.id,
			subscriptionId: data[0]?.id,
		})

		YooCheckoutWidget(res.confirmationToken,
			res.returnUrl + '/lk',
			err => console.log(err))
	}

	const cancelSubscription = async () => {
		if (session == 'loading' || !data) return
		setNot(false)

		try {
			await makeFetcher(unsubscribe)({
				userId: session?.user?.id,
				subscriptionId: data[0]?.id,
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
			{(data && data.length > 0)
				&& <article className={styles.subscription}>
					{!data
						? <div>Пока нет информации о подписках</div>
						:						<>{data.map(p => <>
							<Item key={p.id} item={p} update={update} />
							{p.paymentTitle
								&& <button onClick={resetPayment}>отвязать способ оплаты</button>
							}
							{p.licenseId !== 1
								&& < button onClick={changePayment}>привязать способ оплаты</button>
							}
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

export default Subscriptions
