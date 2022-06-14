import styles from '@/styles/controls/Loader.module.scss'

export interface Props {
	className?: string
}

const Loader = ({ className }: Props) => {
	return (
		<div className={className}>
			<span className={styles.loader}></span>
		</div>
	)
}

export default Loader
