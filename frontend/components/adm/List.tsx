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
	maxWidth?: number
}

const List = ({ rows, callback, length = 0, maxWidth = 20 }: Props) => {

	const styleMaxWidth = {
		maxWidth: maxWidth / (rows ? rows.length : 1) + 'vw'
	}

	return (
		<article className={styles.list}>
			<header>Задания</header>
			<section className={styles.content}>
				<table className={styles.table}>
					<thead>
						<tr>
							{rows?.map((p, i) => <th key={i}><div>{p.header}</div></th>)}
						</tr>
					</thead>
					<tbody>
						{Array.from({ length }).map((u, i) =>
							<tr onClick={() => callback && callback(i)} key={i}>{
								rows?.map((p, pi) =>
									p.key
										? <th key={pi}><div style={styleMaxWidth}>{i}</div></th>
										: <td key={pi}><div style={styleMaxWidth} >{p.value(i)}</div></td>
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
