import { describe, expect, it } from 'vitest'
import type { StudioSheetItem } from './types'

import { parseCreateStudioWorklist, parseUpdateStudioWorklist, parseVisibility } from './validation'

const task = {
	id: 17,
	name: 'Звуковой анализ',
	description: 'Описание задания',
	instruction: 'Инструкция педагогу',
	complexity: 2,
	image: '/uploads/task/example.png',
}

const sheet = (items = [ task ]) => ({ version: 1, data: { items } })
const settings = {
	format: 'A4', margins: { top: 12, right: 12, bottom: 12, left: 12 }, footer: 'Для Алисы',
	showPageNumbers: true, showItemNumbers: true, fontSizePt: 10, itemGapMm: 5,
}
	const richItem: StudioSheetItem = {
	instanceId: 'copy-1', sourceTaskId: 17, kind: 'task', name: task.name,
	description: task.description, instruction: task.instruction, complexity: 2, image: task.image,
	showDescription: true, showInstruction: true, imageWidthPercent: 75,
	imageAlignment: 'center', spacerHeightMm: 0,
}
const sheetV2 = (items = [ richItem ], pageSettings = settings) => ({
	version: 2, data: { items, settings: pageSettings },
})

describe('studio worklist validation', () => {
	it('accepts two independent versioned sheets', () => {
		const result = parseCreateStudioWorklist({
			name: 'Занятие 1',
			teacherSheet: sheet(),
			studentSheet: sheet([]),
		})

		expect(result).toEqual({
			value: {
				name: 'Занятие 1',
				teacherSheet: sheet(),
				studentSheet: sheet([]),
			},
		})
	})

	it('rejects malformed tasks and duplicate task ids inside one sheet', () => {
		expect(parseCreateStudioWorklist({
			name: 'Занятие 1',
			teacherSheet: sheet([ { ...task, name: '' } ]),
			studentSheet: sheet([]),
		})).toHaveProperty('error')
		expect(parseCreateStudioWorklist({
			name: 'Занятие 1',
			teacherSheet: sheet([ task, task ]),
			studentSheet: sheet([]),
		})).toHaveProperty('error')
	})

	it('accepts page settings, editable copies, and user images', () => {
		const result = parseCreateStudioWorklist({
			name: 'Занятие 2',
			teacherSheet: sheetV2([ richItem, { ...richItem, instanceId: 'copy-2' }, {
				...richItem, instanceId: 'custom', sourceTaskId: null, kind: 'image', image: '/api/studio/files/custom.png',
			} ]),
			studentSheet: sheetV2([]),
		})
		expect(result).toHaveProperty('value')
	})

	it('rejects invalid margins, duplicate instances, and empty image elements', () => {
		expect(parseCreateStudioWorklist({
			name: 'Плохие поля',
			teacherSheet: sheetV2([], { ...settings, margins: { top: 12, right: 110, bottom: 12, left: 110 } }),
			studentSheet: sheetV2([]),
		})).toHaveProperty('error')
		expect(parseCreateStudioWorklist({
			name: 'Повтор', teacherSheet: sheetV2([ richItem, richItem ]), studentSheet: sheetV2([]),
		})).toHaveProperty('error')
		expect(parseCreateStudioWorklist({
			name: 'Без файла',
			teacherSheet: sheetV2([ { ...richItem, kind: 'image', image: null } ]),
			studentSheet: sheetV2([]),
		})).toHaveProperty('error')
	})

	it('allows partial updates but rejects an empty update', () => {
		expect(parseUpdateStudioWorklist({ name: 'Новое название' })).toEqual({
			value: { name: 'Новое название' },
		})
		expect(parseUpdateStudioWorklist({})).toHaveProperty('error')
	})

	it('accepts only boolean visibility values', () => {
		expect(parseVisibility({ visible: false })).toEqual({ value: false })
		expect(parseVisibility({ visible: 'false' })).toHaveProperty('error')
	})
})
