import { constants } from 'node:fs'
import { copyFile, mkdir, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { getStudioUploadRoot, isStudioFileName, studioOwnerDirectory } from './uploads'
import { StudioSheet, upgradeStudioSheet } from './types'

// Each recipient owns their image files, so copies still work after a program
// is unpublished or the author removes an image from its original version.
export const copyProgramImages = async (sheets: string[], authorId: string, recipientId: string) => {
	const copies: string[] = []
	const images = new Map<string, string>()
	const cleanup = async () => { await Promise.all(copies.map(file => unlink(file).catch(() => undefined))) }
	try {
		const result = []
		for (const serialized of sheets) {
			const sheet = upgradeStudioSheet(JSON.parse(serialized) as StudioSheet)
			for (const item of sheet.data.items.flatMap(row => row.companion ? [row, row.companion] : [row])) {
				if (!item.image?.startsWith('/api/studio/files/')) continue
				const name = item.image.slice('/api/studio/files/'.length)
				if (!isStudioFileName(name)) throw new Error('Некорректное изображение в программе')
				if (!images.has(name)) {
					const root = getStudioUploadRoot()
					const destination = path.join(root, studioOwnerDirectory(recipientId))
					await mkdir(destination, { recursive: true })
					const newName = `${randomUUID()}${path.extname(name)}`
					const file = path.join(destination, newName)
					await copyFile(path.join(root, studioOwnerDirectory(authorId), name), file, constants.COPYFILE_EXCL)
					copies.push(file)
					images.set(name, `/api/studio/files/${newName}`)
				}
				item.image = images.get(name)!
			}
			result.push(JSON.stringify(sheet))
		}
		return { sheets: result, cleanup }
	} catch (error) {
		await cleanup()
		throw error
	}
}
