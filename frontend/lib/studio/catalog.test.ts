import { describe, expect, it } from 'vitest'
import { buildCategoryForest, collectDescendantCategoryIds, selectRootCategoryIds } from './catalog'

describe('studio catalog hierarchy', () => {
	it('includes every descendant exactly once and tolerates a bad cycle', () => {
		expect(collectDescendantCategoryIds([ 1 ], [
			{ id: 1, childrenIds: [ 2, 3 ] },
			{ id: 2, childrenIds: [ 4 ] },
			{ id: 3, childrenIds: [ 4 ] },
			{ id: 4, childrenIds: [ 1 ] },
		])).toEqual([ 1, 2, 3, 4 ])
	})

	it('does not expose missing category ids', () => {
		expect(collectDescendantCategoryIds([ 1, 99 ], [
			{ id: 1, childrenIds: [ 2 ] },
			{ id: 2, childrenIds: [] },
		])).toEqual([ 1, 2 ])
	})

	it('builds nested course folders and cuts a cyclic edge', () => {
		const nodes = [
			{ id: 1, name: 'Фактор', tasks: [], childrenIds: [ 2 ] },
			{ id: 2, name: 'Раздел', tasks: [], childrenIds: [ 3 ] },
			{ id: 3, name: 'Упражнения', tasks: [ { id: 7 } ], childrenIds: [ 1 ] },
		]
		const forest = buildCategoryForest([ 1 ], nodes)
		expect(forest[0]?.name).toBe('Фактор')
		expect(forest[0]?.children[0]?.name).toBe('Раздел')
		expect(forest[0]?.children[0]?.children[0]?.tasks).toEqual([ { id: 7 } ])
		expect(forest[0]?.children[0]?.children[0]?.children).toEqual([])
	})

	it('removes linked descendants from the course root list without dropping a lone child', () => {
		const nodes = [
			{ id: 1, childrenIds: [ 2 ] },
			{ id: 2, childrenIds: [ 3 ] },
			{ id: 3, childrenIds: [] },
		]
		expect(selectRootCategoryIds([ 1, 2, 3 ], nodes)).toEqual([ 1 ])
		expect(selectRootCategoryIds([ 1, 3 ], nodes)).toEqual([ 1 ])
		expect(selectRootCategoryIds([ 2 ], nodes)).toEqual([ 2 ])
	})

	it('places a shared category only once in the rendered tree', () => {
		const forest = buildCategoryForest([ 1 ], [
			{ id: 1, name: 'Корень', childrenIds: [ 2, 3 ] },
			{ id: 2, name: 'Слева', childrenIds: [ 4 ] },
			{ id: 3, name: 'Справа', childrenIds: [ 4 ] },
			{ id: 4, name: 'Общий раздел', childrenIds: [] },
		])
		const names = JSON.stringify(forest)
		expect(names.match(/Общий раздел/g)).toHaveLength(1)
	})
})
