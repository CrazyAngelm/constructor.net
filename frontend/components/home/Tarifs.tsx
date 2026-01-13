import CardTarif from '../pricing/CardTarif'
import f1 from '@/assets/home/first.png'
import f2 from '@/assets/home/second.png'
import f3 from '@/assets/home/third.png'
import styles from '@/styles/home/Tarifs.module.scss'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { freeSubscribe, getLicenses, subscribe } from '@/lib/requests/subscription'
import { useState } from 'react'
import { useSession } from '@/lib/session/hooks'
import { makeFetcher } from '@/lib/fetchers'
import { SubscribeRes } from '@/lib/dto/subscription'
import { YooCheckoutWidget } from '@/lib/YooCheckoutWidget'
import Auth from '../auth/Auth'
import Router from 'next/router'
import Order from '../pricing/Order'
import { ApiError } from '@/lib/requests'
import Modal from '../controls/Modal'


const Tarifs = () => {
	const [ errorAuth, setErrorAuth ] = useState<boolean>(false)
	const [ error, setError ] = useState<string>()
	const [ visible, setVisible ] = useState(false)

	const { data, update } = useFetchData({}, getLicenses)
	const session = useSession()

	const onSubmit = async () => {
		if (session === null || session === undefined || session === 'loading') return

		try {
			const res = await makeFetcher(freeSubscribe)({
				userId: session.user?.id,
				licenseId: 1,
			})
			Router.push('/subscribe-sucessful')
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 412) setError('Вы уже имеете активную подписку, чтобы оформить новую отмените текущую в личном кабинете')
				else setError(err.message)
			}
			console.log('error', err)
		} finally {
			setVisible(false)
		}
	}

	return (
		<article className={styles.tarifs} id="pricing">
			<Modal closeCallback={() => setError(undefined)}
				visible={error !== undefined}>
				<section className={styles.error}>
					<header>Ошибка!</header>
					<div>{error}</div>
				</section>
			</Modal>
			{visible && <Order okCallback={onSubmit}
				closeCallback={() => setVisible(false)}
				license={data ? data[0] : undefined} />}
			<section className={styles.cards}>
				<div className={styles.background} />
				{
					data?.map((p, index) => <CardTarif key={p.id ?? index} license={p} />)
				}
			</section>
			<section className={styles.free} id="free">
				<header>Бесплатное тестирование</header>
				<p>Мы предоставляем 14 дней пользования приложением в подарок!<br />
					Зарегистрируйся и пройди тестовый период!</p>
				{!session || session === 'loading'
					? <Auth
						button={<button>Попробовать бесплатно</button>} />
					: <button onClick={() => setVisible(true)}>Попробовать бесплатно</button>
				}

			</section>
		</article>
	)
}

export default Tarifs




