import { NextPage } from 'next'
import styles from '@/styles/docs.module.scss'

const License: NextPage = () => {

	return (
		<object className={styles.docs}>
			<embed src="../docs/license.pdf" width="100%" height="100%" />
		</object>
	)
}

export default License
