export interface CategoryTreeNode {
	id: number
	childrenIds: number[]
}

export type CategoryWithChildren<T> = T & { children: CategoryWithChildren<T>[] }

export const selectRootCategoryIds = (
	linkedIds: number[],
	categories: CategoryTreeNode[],
): number[] => {
	const byId = new Map(categories.map(category => [ category.id, category ]))
	const linked = new Set(linkedIds.filter(id => byId.has(id)))
	const nested = new Set<number>()
	for (const parentId of linked) {
		const pending = [ ...(byId.get(parentId)?.childrenIds ?? []) ]
		const visited = new Set([ parentId ])
		while (pending.length > 0) {
			const childId = pending.shift()
			if (childId === undefined || visited.has(childId)) continue
			visited.add(childId)
			if (linked.has(childId)) nested.add(childId)
			pending.push(...(byId.get(childId)?.childrenIds ?? []))
		}
	}
	const roots = [ ...linked ].filter(id => !nested.has(id))
	// A corrupt all-cyclic graph has no natural root; expose its linked nodes and
	// let buildCategoryForest cut each cyclic edge rather than hiding the course.
	return roots.length > 0 ? roots : [ ...linked ]
}

export const buildCategoryForest = <T extends CategoryTreeNode>(
	rootIds: number[],
	categories: T[],
): CategoryWithChildren<Omit<T, 'childrenIds'>>[] => {
	const byId = new Map(categories.map(category => [ category.id, category ]))
	const visited = new Set<number>()
	const build = (id: number): CategoryWithChildren<Omit<T, 'childrenIds'>> | null => {
		const category = byId.get(id)
		if (!category || visited.has(id)) return null
		visited.add(id)
		const { childrenIds, ...value } = category
		return {
			...value,
			children: childrenIds.map(childId => build(childId))
				.filter((child): child is CategoryWithChildren<Omit<T, 'childrenIds'>> => Boolean(child)),
		}
	}
	return rootIds.map(id => build(id))
		.filter((category): category is CategoryWithChildren<Omit<T, 'childrenIds'>> => Boolean(category))
}

export const collectDescendantCategoryIds = (
	rootIds: number[],
	categories: CategoryTreeNode[],
): number[] => {
	const childrenById = new Map(categories.map((category) => [ category.id, category.childrenIds ]))
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
