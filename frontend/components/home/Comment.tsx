import styles from '@/styles/home/Comment.module.scss'
import quotes from '@/assets/home/about/quotes.svg'
import Image from 'next/image'

export interface Props {
	image?: string
	name?: string
	status?: string
	title?: string
	comment?: string
}

const Comment = ({ image, name, status, title, comment }: Props) => {
	return (
		<article className={styles.comment}>
			<section className={styles.text}>
				<div><Image src={quotes} alt="" /></div>
				<header>«{title}»</header>
				<p>«{comment}»</p>
			</section>
			<section className={styles.autor}>
				<div style={{ backgroundImage: `url("${image}")` }} />
				<header>{name}</header>
				<p>{status}</p>
			</section>
		</article>
	)
}

export default Comment
