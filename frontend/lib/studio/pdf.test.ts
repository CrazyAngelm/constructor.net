import { describe, expect, it } from 'vitest'
import { pdfFileName, studioPageSizeMm } from './pdf'

describe('studio PDF helpers', () => {
	it('keeps the selected physical page format', () => {
		expect(studioPageSizeMm('A5')).toEqual({ width: 148, height: 210 })
		expect(studioPageSizeMm('A4')).toEqual({ width: 210, height: 297 })
		expect(studioPageSizeMm('A3')).toEqual({ width: 297, height: 420 })
	})

	it('creates a safe descriptive PDF filename', () => {
		expect(pdfFileName('Урок №3 / 12.09.2026', 'Лист педагога')).toBe('Урок №3 - 12.09.2026 - Лист педагога.pdf')
	})
})
