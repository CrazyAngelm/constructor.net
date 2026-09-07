import styles from '@/styles/adm/Menu.module.scss'
export interface Item { label?: string; callback?: () => void; items?: Item[] }
export interface Categories { label?: string; items?: Item[] }
export interface Props { categories?: Categories[]; activeLabel?: string }
export default function Menu({ categories, activeLabel }: Props) {
 return <menu className={styles.menu} aria-label="Разделы администрирования">
  <h1>Управление</h1>
  {categories?.map(category => <li key={category.label}>
   <p>{category.label}</p>
   <ul>{category.items?.map(item => <li key={item.label}><button type="button" aria-current={activeLabel === item.label ? 'page' : undefined} onClick={item.callback}>{item.label}</button></li>)}</ul>
  </li>)}
 </menu>
}
