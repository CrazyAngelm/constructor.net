import CardTarif from "../pricing/CardTarif"
import f1 from '@/assets/home/first.png'
import f2 from '@/assets/home/second.png'
import f3 from '@/assets/home/third.png'
import styles from '@/styles/home/Tarifs.module.scss'
import { useFetchData } from "@/lib/hooks/useFetchData"
import { getLicenses } from "@/lib/requests/subscription"


const Tarifs = () => {
	const { data, update, error } = useFetchData({}, getLicenses)

	console.log(data)

	return (
		<article className={styles.tarifs}>

			<section className={styles.cards}>
				<div className={styles.background} />
				{
					data?.map(p => <CardTarif license={p} />)
				}
			</section>
			<section className={styles.free}>
				<header>Бесплатное тестирование</header>
				<p>Попробуйте бесплатно конструктор Lab Studio для вашей деятельности. Мы гарантируем поддержку на каждом этапе работы с нашем конструктором.</p>
				<button>Попробовать бесплатно</button>
			</section>
		</article>
	)
}

export default Tarifs
