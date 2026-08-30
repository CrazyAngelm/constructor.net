import styles from '@/styles/home/Comments.module.scss'
import Comment from './Comment'
import arrow from '@/assets/home/arrow.svg'
import Image from 'next/image'

const Comments = () => {
	return (
		<article className={styles.comments} id="comments">
			<header>Более 480 репетиторов и директоров по всей Россииуже воспользовались нашим продуктом</header>
			<section className={styles.content}>
				<Comment name="Зигмунд Фрейд" status="Старый психолог"
					image="https://avatars.mds.yandex.net/get-kinopoisk-image/1629390/810db7a3-462f-40a9-8c3a-c1ec18b2774b/3840x"
					title="Мои ученики почувствовали разницу"
					comment="Больше спасибо Lab Studio, ведь мои ученики стали учиться гораздо эффективнее. Я стал тратить меньше времени на подготовку. Начал больше зарабатывать, благодаря свободному времени!"
				/>
			</section>
			<section className={styles.buttons}>
				<button >
					<div className={styles.left}>
						<Image src={arrow} alt="" objectFit="contain" layout="fill" />
					</div>
				</button>
				<button >
					<div className={styles.right}>
						<Image src={arrow} alt="" objectFit="contain" layout="fill" />
					</div>
				</button>
			</section>
		</article>
	)
}

export default Comments
