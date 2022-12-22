import CardTarif from "../pricing/CardTarif"
import f1 from '@/assets/home/first.png'
import f2 from '@/assets/home/second.png'
import f3 from '@/assets/home/third.png'
import styles from '@/styles/home/Tarifs.module.scss'


const Tarifs = () => {
	return (
		<article className={styles.tarifs}>

			<section className={styles.cards}>
				<div className={styles.background} />
				<CardTarif title="Пробный. 30 дней" img={f1.src}
					description="Приложение + 1 курс. В колонтитуле наше лого"
					price={0} />
				<CardTarif title="Базовый" img={f2.src}
					description="Приложение + 1 курс + любые колонтитулы"
					price={300} />
				<CardTarif title="Pro" img={f3.src}
					description="Приложение + 3 курса + любые колонтитулы"
					price={600} />
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
