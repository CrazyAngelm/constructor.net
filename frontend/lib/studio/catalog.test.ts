import { describe, expect, it } from 'vitest'
import { collectDescendantCategoryIds } from './catalog'

describe('studio catalog hierarchy', () => {
	it('includes every descendant exactly once and tolerates a bad cycle', () => {
		expect(collectDescendantCategoryIds([1], [
			{ id: 1, childrenIds: [2, 3] },
			{ id: 2, childrenIds: [4] },
			{ id: 3, childrenIds: [4] },
			{ id: 4, childrenIds: [1] },
		])).toEqual([1, 2, 3, 4])
	})

	it('does not expose missing category ids', () => {
		expect(collectDescendantCategoryIds([1, 99], [
			{ id: 1, childrenIds: [2] },
			{ id: 2, childrenIds: [] },
		])).toEqual([1, 2])
	})
})
