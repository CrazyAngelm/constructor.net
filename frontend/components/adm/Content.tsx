import styles from '@/styles/adm/Content.module.scss'
import UserContent from './contents/user/UserContent'

const Content = () => {
	return (
		<article className={styles.content}>
			<UserContent />
		</article>
	)
}

export default Content
