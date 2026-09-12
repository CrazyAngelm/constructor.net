import { describe, expect, it } from 'vitest'
import { catalogTaskToSheetItem, defaultPageSettings, emptyStudioSheet, upgradeStudioSheet } from './types'
import { parseCreateStudioWorklist } from './validation'
import { paginateByMeasuredHeight } from './pagination'
import { pairSheetItems, swapSheetPair, unpairSheetItems, updateSheetItem } from './items'

const image = catalogTaskToSheetItem({ id: 1, name: 'Картинка', image: '/uploads/task/a.png', description: '', instruction: '', complexity: null }, 'left')
const payload = (items: unknown[]) => ({ name: 'Конспект', teacherSheet: { version: 3, data: { items, settings: { ...defaultPageSettings(), fontFamily: 'Arial', headingSizePt: 15, footerFontFamily: 'Arial', footerSizePt: 8 } } }, studentSheet: emptyStudioSheet() })

describe('editable print layout', () => {
	it('pairs, edits, swaps and unpairs without changing snapshots or order', () => {
		const original = [ image, { ...image, instanceId: 'right' }, { ...image, instanceId: 'third' } ]
		const paired = pairSheetItems(original, 'left')
		expect(paired).toHaveLength(2)
		expect(paired[0]?.companion?.instanceId).toBe('right')
		const edited = updateSheetItem(paired, 'right', { instruction: 'Изменено', imageWidthPercent: 45 })
		expect(edited[0]?.companion?.imageWidthPercent).toBe(45)
		expect(original[1]?.instruction).toBe('')
		const swapped = swapSheetPair(edited, 'left')
		expect(unpairSheetItems(swapped, 'right').map(item => item.instanceId)).toEqual([ 'right', 'left', 'third' ])
		expect(pairSheetItems(paired, 'left')).toBe(paired)
	})
	it('persists two columns and per-item typography in version 3', () => {
		const result = parseCreateStudioWorklist(payload([{ ...image, fontFamily: 'Arial', fontSizePt: 9, textAlignment: 'right', companion: { ...image, instanceId: 'right', kind: 'text', image: null, instruction: 'Рядом с картинкой' } }]))
		expect(result).toHaveProperty('value.teacherSheet.version', 3)
		expect(result).toHaveProperty('value.teacherSheet.data.items.0.companion.instruction', 'Рядом с картинкой')
		expect(result).toHaveProperty('value.teacherSheet.data.items.0.textAlignment', 'right')
	})
	it('rejects nested rows, reused IDs, invalid styles and missing companion images', () => {
		for (const companion of [ { ...image }, { ...image, instanceId: 'right', companion: { ...image, instanceId: 'third' } }, { ...image, instanceId: 'right', kind: 'image', image: null } ]) {
			expect(parseCreateStudioWorklist(payload([{ ...image, companion }]))).toHaveProperty('error')
		}
		expect(parseCreateStudioWorklist(payload([{ ...image, fontSizePt: -1 }]))).toHaveProperty('error')
		expect(parseCreateStudioWorklist(payload([{ ...image, fontFamily: 'url(https://invalid/)' }]))).toHaveProperty('error')
	})
	it('upgrades old sheets without losing content or appearance', () => {
		const previous = { version: 2 as const, data: { items: [ image ], settings: defaultPageSettings() } }
		const upgraded = upgradeStudioSheet(previous)
		expect(upgraded.version).toBe(3)
		expect(upgraded.data.items[0]).toMatchObject(image)
		expect(previous.version).toBe(2)
	})
	it('reflows a reduced image to the preceding page without changing order or spacers', () => {
		const items = [ { instanceId: 'text' }, { instanceId: 'first-image' }, { instanceId: 'second-image' } ]
		const heights = new Map([ [ 'text', 30 ], [ 'first-image', 35 ], [ 'second-image', 40 ] ])
		expect(paginateByMeasuredHeight(items, heights, 100, 5).pages.map(page => page.length)).toEqual([ 2, 1 ])
		heights.set('second-image', 20)
		expect(paginateByMeasuredHeight(items, heights, 100, 5).pages).toEqual([ items ])
	})
})
