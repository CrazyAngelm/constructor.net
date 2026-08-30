import { useCallback, useEffect, useState } from 'react'

import { ApiError, handleNonOk } from '@/lib/requests/shared'

interface VisibilityItem {
	id: string | number
	name: string
	visible: boolean
}

interface VisibilityCatalog {
	courses: VisibilityItem[]
	folders: VisibilityItem[]
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
	return <section>
		<h2>{title}</h2>
		{items.length === 0
			? <p>Нет активных записей.</p>
			: <table>
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
							<td>{item.visible ? 'Показывается' : 'Скрыт'}</td>
							<td>
								<button type="button" onClick={() => onToggle(item)} disabled={isToggling}>
									{isToggling ? 'Сохранение…' : item.visible ? 'Скрыть' : 'Показать'}
								</button>
							</td>
						</tr>
					})}
				</tbody>
			</table>}
	</section>
}

const Visibility = () => {
	const [ catalog, setCatalog ] = useState<VisibilityCatalog>()
	const [ error, setError ] = useState<string>()
	const [ toggling, setToggling ] = useState<string>()

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

	const toggle = async (type: 'course' | 'folder', item: VisibilityItem) => {
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
			setCatalog((current) => current && {
				...current,
				[`${type}s`]: current[`${type}s` as 'courses' | 'folders'].map((currentItem) =>
					String(currentItem.id) === itemId ? { ...currentItem, visible: !item.visible } : currentItem),
			})
		} catch (requestError) {
			setError(readError(requestError))
		} finally {
			setToggling(undefined)
		}
	}

	if (!catalog && !error) return <p>Загрузка каталога…</p>
	if (!catalog) return <section>
		<p>{error}</p>
		<button type="button" onClick={() => void load()}>Повторить</button>
	</section>

	return <article>
		<header>
			<h1>Видимость каталога</h1>
			<p>Скрытые записи не показываются в веб-каталоге. Удаление здесь недоступно.</p>
		</header>
		{error && <p role="alert">{error}</p>}
		<VisibilityGroup title="Курсы" items={catalog.courses}
			togglingId={toggling?.replace('course:', '')} onToggle={(item) => void toggle('course', item)} />
		<VisibilityGroup title="Папки" items={catalog.folders}
			togglingId={toggling?.replace('folder:', '')} onToggle={(item) => void toggle('folder', item)} />
	</article>
}

export default Visibility
