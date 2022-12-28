import { Subscription } from '@/lib/dto/subscription'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { getLicenses, getSubscription } from '@/lib/requests/subscription'
import { useSession } from '@/lib/session/hooks'
import styles from '@/styles/lk/Subscription.module.scss'

interface PropsItem {
	item: Subscription
}

const Item = ({ item }: PropsItem) => {
	const { data } = useFetchData({}, getLicenses)

	const license = data?.find(p => p.id == item.licenseId)
	return (
		<section className={styles.item}>
			{license?.name}
		</section>
	)
}

const Subscription = () => {
	const session = useSession()
	const { data } = useFetchData({ id: (session != 'loading') ? session?.user?.id : undefined },
		getSubscription);
	return (
		<>
			{data &&
				<article className={styles.subcriprion}>
					{data.map(p => <Item item={p} />)}
				</article>
			}
		</>
	)
}

export default Subscription
