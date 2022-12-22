import styles from '@/styles/home/ExpanderFAQ.module.scss'
import { useState } from 'react'

export interface Props {
	question?: string
	answer?: string
}

const ExpanderFAQ = ({ question, answer }: Props) => {
	const [ isExpanded, setIsExpanded ] = useState(false);

	return (
		<article className={styles.expander}>
			<header>{question}</header>
			<section className={`${!isExpanded ? styles.hide : null}`}>{answer}</section>
			<div className={`${styles.arrow} ${isExpanded ? styles.expand : ""}`}
				onClick={() => setIsExpanded(!isExpanded)} >
				<div />
			</div>
		</article>
	)
}

export default ExpanderFAQ;
