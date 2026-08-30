export interface CategoryTreeNode {
	id: number
	childrenIds: number[]
}

export const collectDescendantCategoryIds = (
	rootIds: number[],
	categories: CategoryTreeNode[],
): number[] => {
	const childrenById = new Map(categories.map((category) => [category.id, category.childrenIds]))
	const pending = [ ...rootIds ]
	const visited = new Set<number>()
	while (pending.length > 0) {
		const id = pending.shift()
		if (id === undefined || visited.has(id) || !childrenById.has(id)) continue
		visited.add(id)
		pending.push(...(childrenById.get(id) ?? []))
	}
	return [ ...visited ]
}
