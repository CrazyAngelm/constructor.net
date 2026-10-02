import { createHash } from 'node:crypto'
import path from 'node:path'

// The largest current catalog image is 4,586,959 bytes; the next whole MiB keeps
// existing-quality source material uploadable while bounding request memory.
export const STUDIO_UPLOAD_MAX_BYTES = 5 * 1024 * 1024

export const studioOwnerDirectory = (userId: string): string =>
	createHash('sha256').update(userId).digest('hex')

export const getStudioUploadRoot = (): string => {
	const configured = process.env.STUDIO_UPLOAD_DIR?.trim()
	if (!configured) throw new Error('STUDIO_UPLOAD_DIR is not configured')
	return path.resolve(configured)
}

export const sniffStudioImage = (buffer: Buffer): { extension: 'png' | 'jpg'; contentType: string } | null => {
	if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([ 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a ]))) {
		return { extension: 'png', contentType: 'image/png' }
	}
	if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
		return { extension: 'jpg', contentType: 'image/jpeg' }
	}
	return null
}

export const isStudioFileName = (value: unknown): value is string =>
	typeof value === 'string' && /^[0-9a-f-]{36}\.(png|jpg)$/.test(value)
