import { useCallback, useEffect, useState } from 'react'

import { ApiError, handleNonOk } from '@/lib/requests/shared'
import styles from '@/styles/adm/Visibility.module.scss'

interface VisibilityItem {
	id: string | number
	name: string
	visible: boolean
}

interface VisibilityCatalog {
	courses: VisibilityItem[]
	folders: VisibilityItem[]
	categories: VisibilityItem[]
}

const readError = (error: unknown): string => {
	if (error instanceof ApiError) return error.message
	return 'Не удалось загрузить каталог. Попробуйте ещё раз.'
}

const VisibilityGroup = ({
	title,
	items,
	togglingId,
	onToggle,
}: {
	title: string
	items: VisibilityItem[]
	togglingId?: string
	onToggle: (item: VisibilityItem) => void
}) => {
	return <section className={styles.group}>
		<h2>{title}</h2>
		{items.length === 0
			? <p>Нет активных записей.</p>
			: <div className={styles.tableScroll}><table>
				<thead>
					<tr>
						<th>Название</th>
						<th>Статус</th>
						<th aria-label="Действие" />
					</tr>
				</thead>
				<tbody>
					{items.map((item) => {
						const itemId = String(item.id)
						const isToggling = togglingId === itemId
						return <tr key={itemId}>
							<td>{item.name}</td>
							<td><span className={item.visible ? styles.visible : styles.hidden}>{item.visible ? 'Показывается' : 'Скрыт'}</span></td>
							<td>
								<button type="button" onClick={() => onToggle(item)} disabled={isToggling}>
									{isToggling ? 'Сохранение…' : item.visible ? 'Скрыть' : 'Показать'}
								</button>
							</td>
						</tr>
					})}
				</tbody>
			</table></div>}
	</section>
}

const Visibility = () => {
	const [ catalog, setCatalog ] = useState<VisibilityCatalog>()
	const [ error, setError ] = useState<string>()
	const [ toggling, setToggling ] = useState<string>()
	const [ query, setQuery ] = useState('')
	const filtered = (items: VisibilityItem[]) => items.filter(item => item.name.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru')))

	const load = useCallback(async () => {
		setError(undefined)
		try {
			const response = await fetch('/api/admin/visibility')
			await handleNonOk(response)
			setCatalog(await response.json() as VisibilityCatalog)
		} catch (requestError) {
			setError(readError(requestError))
		}
	}, [])

	useEffect(() => {
		void load()
	}, [ load ])

	const toggle = async (type: 'course' | 'folder' | 'category', item: VisibilityItem) => {
		const itemId = String(item.id)
		setToggling(`${type}:${itemId}`)
		setError(undefined)
		try {
			const response = await fetch(`/api/admin/visibility/${type}/${encodeURIComponent(itemId)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ visible: !item.visible }),
			})
			await handleNonOk(response)
			const collection = type === 'category' ? 'categories' : type === 'course' ? 'courses' : 'folders'
			setCatalog((current) => current && {
				...current,
				[collection]: current[collection].map((currentItem) =>
					String(currentItem.id) === itemId ? { ...currentItem, visible: !item.visible } : currentItem),
			})
		} catch (requestError) {
			setError(readError(requestError))
		} finally {
			setToggling(undefined)
		}
	}

	if (!catalog && !error) return <p className={styles.loading} role="status">Загрузка каталога…</p>
	if (!catalog) return <section>
		<p>{error}</p>
		<button type="button" onClick={() => void load()}>Повторить</button>
	</section>

	return <article className={styles.page}>
		<header>
			<h1>Видимость каталога</h1>
			<p>Скрытые записи не показываются в веб-каталоге. Удаление здесь недоступно.</p>
		</header>
		<label className={styles.search}>Поиск по названию<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Курс или папка" /></label>
		{error && <p role="alert">{error}</p>}
		<VisibilityGroup title="Курсы" items={filtered(catalog.courses)}
			togglingId={toggling?.replace('course:', '')} onToggle={(item) => void toggle('course', item)} />
		<VisibilityGroup title="Папки" items={filtered(catalog.folders)}
			togglingId={toggling?.replace('folder:', '')} onToggle={(item) => void toggle('folder', item)} />
		<VisibilityGroup title="Папки заданий" items={filtered(catalog.categories)}
			togglingId={toggling?.replace('category:', '')} onToggle={(item) => void toggle('category', item)} />
	</article>
}

export default Visibility
