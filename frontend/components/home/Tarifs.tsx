import CardTarif from "../pricing/CardTarif"
import f1 from '@/assets/home/first.png'
import f2 from '@/assets/home/second.png'
import f3 from '@/assets/home/third.png'
import styles from '@/styles/home/Tarifs.module.scss'
import { useFetchData } from "@/lib/hooks/useFetchData"
import { getLicenses, subscribe } from "@/lib/requests/subscription"
import { useState } from "react"
import { useSession } from "@/lib/session/hooks"
import { makeFetcher } from "@/lib/fetchers"
import { SubscribeRes } from "@/lib/dto/subscription"
import { YooCheckoutWidget } from "@/lib/YooCheckoutWidget"
import Auth from "../auth/Auth"
import Router from "next/router"
import Order from "../pricing/Order"


const Tarifs = () => {
	const { data, update, error } = useFetchData({}, getLicenses)

	const [ errorAuth, setErrorAuth ] = useState<boolean>(false);
	const [ visible, setVisible ] = useState(false)

	const session = useSession()

	const onSubmit = async () => {

		if (session == null || session == 'loading') return

		Router.push('./subscribe-sucessful')
	}

	return (
		<article className={styles.tarifs} id="pricing">
			{visible && <Order okCallback={onSubmit}
				closeCallback={() => setVisible(false)}
				license={data ? data[0] : undefined} />}
			<section className={styles.cards}>
				<div className={styles.background} />
				{
					data?.map(p => <CardTarif license={p} />)
				}
			</section>
			<section className={styles.free} id="free">
				<header>Бесплатное тестирование</header>
				<p>Попробуйте бесплатно конструктор Lab Studio для вашей деятельности. Мы гарантируем поддержку на каждом этапе работы с нашем конструктором.</p>
				{!session || session == 'loading' ?
					<Auth
						button={<button>Попробовать бесплатно</button>} />
					: <button onClick={() => setVisible(true)}>Попробовать бесплатно</button>
				}

			</section>
		</article>
	)
}

export default Tarifs
