import Layout from '@/components/Layout'
import { NextPage } from 'next'
import styles from '@/styles/subscribe-sucessful.module.scss'
import Image from 'next/image'
import sucessful from '@/assets/sucessful.svg'

const SubscribeSucessful: NextPage = () => {

	return (
		<Layout navbar={false} footer={false}>
			<article className={styles.index}>
				<div className={styles.image}>
					<Image src={sucessful} objectFit="contain"
						layout="fill" />
				</div>
				<section>Подписка совершена успешно!<br />
					Перейдите в личный кабинет, что бы скачать приложение</section>
				<a href="../lk#subscription"><button>Перейти</button></a>
			</article>
		</Layout>
	)
}

export default SubscribeSucessful
