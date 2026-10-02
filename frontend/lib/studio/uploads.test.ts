import { describe, expect, it } from 'vitest'

import { isStudioFileName, sniffStudioImage, studioOwnerDirectory } from './uploads'

describe('studio image uploads', () => {
	it('recognizes the bytes of supported images instead of trusting the file name', () => {
		expect(sniffStudioImage(Buffer.from([ 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a ])))
			.toEqual({ extension: 'png', contentType: 'image/png' })
		expect(sniffStudioImage(Buffer.from([ 0xff, 0xd8, 0xff, 0xe0 ])))
			.toEqual({ extension: 'jpg', contentType: 'image/jpeg' })
		expect(sniffStudioImage(Buffer.from('<svg></svg>'))).toBeNull()
	})

	it('keeps user storage separate and accepts only generated file names', () => {
		expect(studioOwnerDirectory('one')).not.toBe(studioOwnerDirectory('two'))
		expect(isStudioFileName('123e4567-e89b-12d3-a456-426614174000.png')).toBe(true)
		expect(isStudioFileName('../secret.png')).toBe(false)
	})
})
