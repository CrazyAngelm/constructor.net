import image from '@/assets/home/Kollazh.png'

import styles from '@/styles/home/TittlePanel.module.scss'
import Image from 'next/image'

const TittlePanel = () => {
	return (
		<article className={styles.tittlePanel}>
			<section className={styles.container}>
				<div className={styles.offer}>
					<h1>Готовое задание за 15 минут!</h1>
					<p className={styles.intro}>
						Удобный конструктор заданий для вашего ученика. Сэкономьте ваше время и повысьте эффективность обучения
					</p>
					<a href="#free">
						<button className={styles.btn}>Попробовать бесплатно</button>
					</a>
				</div>
				<section className={styles.image}>
					<Image src={image} layout="fill" objectFit="contain"/>
				</section>
			</section>
		</article>
	)
}

export default TittlePanel
