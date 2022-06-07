import styles from '@/styles/adm/List.module.scss'

interface Row {
	header: string
	value: (id: number) => string
	key?: boolean
}

interface Props {
	rows?: Row[]
	length: number
	callback?: (id: number) => void
}

const List = ({ rows, callback, length = 0 }: Props) => {

	return (
		<article className={styles.list}>
			<header>Задания</header>
			<table className={styles.table}>
				<thead>
					<tr>
						{rows?.map((p, i) => <th key={i}>{p.header}</th>)}
					</tr>
				</thead>
			</table>
			<section className={styles.content}>
				<table className={styles.table}>
					<tbody>
						{Array.from({ length }).map((u, i) =>
							<tr onClick={() => callback && callback(i)} key={i}>{
								rows?.map((p, pi) =>
									p.key
										? <th key={pi}>{p.value(i)}</th>
										: <td key={pi}>{p.value(i)}</td>
								)
							}</tr>
						)}
					</tbody>
				</table>
			</section>
		</article>
	)
}

export default List
