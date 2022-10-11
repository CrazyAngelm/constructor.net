import child from '@/assets/home/child.png'

import styles from '@/styles/home/TittlePanel.module.scss'
import Image from 'next/image';

const TittlePanel = () => {
	return (
		<article className={styles.tittlePanel}>
			<section className={styles.container}>
				<div className={styles.offer}>
					<h1>Готовое задание за 15 минут!</h1>
					<p className={styles.intro}>
						Удобный конструктор заданий для вашего ученика. Сэкономьте ваше время и повысьте эффективность обучения
					</p>
					<button className={styles.btn}>Попробовать бесплатно</button>
				</div>
				<section className={styles.child}>
					<Image src={child} />
				</section>
			</section>
		</article>
	)
}

export default TittlePanel;
