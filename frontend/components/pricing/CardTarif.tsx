import styles from '@/styles/pricing/CardTarif.module.scss'
import Image from 'next/image'

interface Props {
	title?: string
	img?: string
	price?: number
	description?: string
}

const CardTarif = ({ title, img, price, description }: Props) => {
	return (
		<article className={styles.cardTarifs}>
			<header>
				{img && <img src={img}></img>}
			</header>
			<section>
				<h3>{title}</h3>
				<p className={styles.description}>
					{description}
				</p>
				<p className={styles.price}>{price}₽/мес.</p>
				<button>Купить</button>
			</section>
		</article>
	)
}

export default CardTarif
