import { describe, expect, it } from 'vitest'

import { parseCreateStudioWorklist, parseUpdateStudioWorklist, parseVisibility } from './validation'

const task = {
	id: 17,
	name: 'Звуковой анализ',
	description: 'Описание задания',
	instruction: 'Инструкция педагогу',
	complexity: 2,
	image: '/uploads/task/example.png',
}

const sheet = (items = [task]) => ({ version: 1, data: { items } })

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
			teacherSheet: sheet([{ ...task, name: '' }]),
			studentSheet: sheet([]),
		})).toHaveProperty('error')
		expect(parseCreateStudioWorklist({
			name: 'Занятие 1',
			teacherSheet: sheet([task, task]),
			studentSheet: sheet([]),
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
