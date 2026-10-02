import styles from '@/styles/adm/List.module.scss'
interface Row { header: string; value: (id: number) => string; key?: boolean }
interface Props { name?: string; rows?: Row[]; length: number; callback?: (id: number) => void; maxWidth?: number; selected?: number }
export default function List({ name, rows, callback, length = 0, selected }: Props) {
 return <article className={styles.list}>
  {name && <h2>{name}</h2>}
  {!length ? <p className={styles.empty}>Пока нет записей.</p> : <div className={styles.content}><table>
   <thead><tr>{rows?.map((row, i) => <th key={i} style={row.header.toLowerCase() === 'id' ? { width: 64 } : undefined}>{row.header === 'id' ? 'ID' : row.header}</th>)}</tr></thead>
   <tbody>{Array.from({length}, (_, i) => <tr key={i} className={selected === i ? styles.selected : ''} tabIndex={callback ? 0 : undefined} onClick={() => callback?.(i)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); callback?.(i) } }}>
    {rows?.map((row, j) => <td key={j} title={row.key ? String(i) : row.value(i)}>{row.key ? i : row.value(i)}</td>)}
   </tr>)}</tbody>
  </table></div>}
 </article>
}
