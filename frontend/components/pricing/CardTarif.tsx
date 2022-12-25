import { LicenseDto } from '@/lib/dto/subscription'
import styles from '@/styles/pricing/CardTarif.module.scss'
import Head from 'next/head'
import Image from 'next/image'
import Script from 'next/script'

interface Props {
	license: LicenseDto,
	img?: string
}

const CardTarif = ({ license, img }: Props) => {

	const onSubmit = () => {
		/* fetch('/api/subscription/subscribe', {
			method: "GET",
		}).then(p => console.log(p))
		.catch(err => console.log(err)) */


	}

	return (
		<article className={styles.cardTarifs}>
			<div id='payment-form'></div>
			<header>
				{img && <img src={img}></img>}
			</header>
			<section>
				<h3>{license.name}</h3>
				<p className={styles.description}>
					{license?.description}
				</p>
				<p className={styles.price}>{license?.price}₽ / {license.duration} д.</p>
				<button onClick={onSubmit}>Купить</button>
			</section>
		</article>
	)
}

export default CardTarif
