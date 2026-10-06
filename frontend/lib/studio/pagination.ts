export interface PaginatedItem {
	instanceId: string
}

export const paginateByMeasuredHeight = <T extends PaginatedItem>(
	items: T[],
	heights: Map<string, number>,
	capacity: number,
	gap: number,
): { pages: T[][]; oversized: string[] } => {
	if (items.length === 0) return { pages: [ [] ], oversized: [] }
	const pages: T[][] = []
	const oversized: string[] = []
	let page: T[] = []
	let used = 0
	for (const item of items) {
		const height = heights.get(item.instanceId) ?? 0
		if (height > capacity) oversized.push(item.instanceId)
		const required = height + (page.length ? gap : 0)
		if (page.length && used + required > capacity) {
			pages.push(page)
			page = []
			used = 0
		}
		page.push(item)
		used += height + (page.length > 1 ? gap : 0)
	}
	if (page.length) pages.push(page)
	return { pages, oversized }
}
