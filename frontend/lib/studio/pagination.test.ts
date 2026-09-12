import { describe, expect, it } from 'vitest'

import { paginateByMeasuredHeight } from './pagination'

const item = (instanceId: string) => ({ instanceId })

describe('sheet pagination', () => {
	it('keeps whole exercises together and uses remaining page height', () => {
		const items = [ item('a'), item('b'), item('c') ]
		const result = paginateByMeasuredHeight(items, new Map([ [ 'a', 40 ], [ 'b', 45 ], [ 'c', 30 ] ]), 100, 5)
		expect(result.pages.map(page => page.map(value => value.instanceId))).toEqual([ [ 'a', 'b' ], [ 'c' ] ])
		expect(result.oversized).toEqual([])
	})

	it('isolates and reports an exercise taller than the printable area', () => {
		const items = [ item('a'), item('large'), item('b') ]
		const result = paginateByMeasuredHeight(items, new Map([ [ 'a', 25 ], [ 'large', 120 ], [ 'b', 25 ] ]), 100, 5)
		expect(result.pages.map(page => page.map(value => value.instanceId))).toEqual([ [ 'a' ], [ 'large' ], [ 'b' ] ])
		expect(result.oversized).toEqual([ 'large' ])
	})
})
