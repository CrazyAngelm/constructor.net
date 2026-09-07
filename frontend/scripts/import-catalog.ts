import { PrismaClient } from '@prisma/client'
import { copyFile, mkdir, readFile, stat } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { assertEmptyCatalog, assertPreviewDatabase, requireEnvironment, requirePreviewConfirmation } from './preview-guard'

type SnapshotRow = Record<string, unknown>
type CourseRow = SnapshotRow & { id: number; name: string; description: string; categories?: unknown }
type CategoryRow = SnapshotRow & { id: number; name: string; description: string; CategoryChildren?: unknown }
type TaskRow = SnapshotRow & { id: number; name: string; description: string; instruction: string; image: string }
type TaskLinksRow = SnapshotRow & { categoryId: number; taskIds?: unknown }

const prisma = new PrismaClient()

const asRows = (value: unknown, fileName: string): SnapshotRow[] => {
	const rows = Array.isArray(value) ? value : (value as { response?: unknown })?.response
	if (!Array.isArray(rows) || rows.some((row) => !row || typeof row !== 'object' || Array.isArray(row))) {
		throw new Error(`${fileName} must contain an array or { response: array }`)
	}
	return rows as SnapshotRow[]
}

const readSnapshot = async (directory: string, fileName: string, required = true): Promise<SnapshotRow[]> => {
	try {
		return asRows(JSON.parse(await readFile(resolve(directory, fileName), 'utf8')), fileName)
	} catch (error) {
		if (!required && (error as NodeJS.ErrnoException).code === 'ENOENT') return []
		throw error
	}
}

const integer = (value: unknown, label: string): number => {
	if (!Number.isInteger(value)) throw new Error(`${label} must be an integer`)
	return value as number
}

const text = (value: unknown, label: string): string => {
	if (typeof value !== 'string') throw new Error(`${label} must be a string`)
	return value
}

const optionalDate = (value: unknown, label: string): Date | null => {
	if (value === null || value === undefined || value === '') return null
	const date = new Date(text(value, label))
	if (Number.isNaN(date.getTime())) throw new Error(`${label} must be a valid date`)
	return date
}

const optionalBoolean = (value: unknown, defaultValue: boolean, label: string): boolean => {
	if (value === undefined) return defaultValue
	if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean`)
	return value
}

const distinctIds = (rows: SnapshotRow[], fileName: string): void => {
	const ids = rows.map((row) => integer(row.id, `${fileName}.id`))
	if (new Set(ids).size !== ids.length) throw new Error(`${fileName} contains duplicate ids`)
}

const courseLinks = (courses: CourseRow[]): Array<{ courseId: number; categoryId: number }> => courses.flatMap((course) => {
	if (course.categories === undefined) return []
	if (!Array.isArray(course.categories)) throw new Error(`course ${course.id}.categories must be an array`)
	return course.categories.map((categoryId) => ({ courseId: course.id, categoryId: integer(categoryId, `course ${course.id}.categories`) }))
})

const categoryLinks = (categories: CategoryRow[]): Array<{ parentId: number; childrenId: number }> => categories.flatMap((category) => {
	if (category.CategoryChildren === undefined) return []
	if (!Array.isArray(category.CategoryChildren)) throw new Error(`category ${category.id}.CategoryChildren must be an array`)
	return category.CategoryChildren.map((value) => {
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			throw new Error(`category ${category.id}.CategoryChildren contains an invalid relation`)
		}
		const relation = value as SnapshotRow
		return {
			parentId: integer(relation.parentId, `category ${category.id}.CategoryChildren.parentId`),
			childrenId: integer(relation.childrenId, `category ${category.id}.CategoryChildren.childrenId`),
		}
	})
})

const taskLinks = (rows: TaskLinksRow[]): Array<{ categoryId: number; taskId: number }> => rows.flatMap((row) => {
	const categoryId = integer(row.categoryId, 'category-task-links.categoryId')
	if (!Array.isArray(row.taskIds)) throw new Error(`category ${categoryId}.taskIds must be an array`)
	return row.taskIds.map((taskId) => ({
		categoryId,
		taskId: integer(taskId, `category ${categoryId}.taskIds`),
	}))
})

const assertDistinctPairs = (pairs: Array<Record<string, number>>, label: string): void => {
	const values = pairs.map((pair) => Object.values(pair).join(':'))
	if (new Set(values).size !== values.length) throw new Error(`${label} contains duplicate relations`)
}

const sameIds = (actual: number[], expected: number[]): boolean => actual.length === expected.length
	&& actual.every((id, index) => id === expected[index])

const taskImageFileName = (image: string, taskId: number): string | null => {
	if (!image) return null
	const prefix = '/uploads/task/'
	if (!image.startsWith(prefix)) throw new Error(`task ${taskId}.image must use ${prefix}`)
	const fileName = image.slice(prefix.length)
	if (!fileName || fileName !== basename(fileName) || fileName.includes('\0')) {
		throw new Error(`task ${taskId}.image contains an unsafe file name`)
	}
	return fileName
}

const copyCatalogAssets = async (tasks: TaskRow[]): Promise<number> => {
	const sourceDirectory = requireEnvironment('CATALOG_UPLOADS_DIR')
	const destinationDirectory = requireEnvironment('UPLOAD_IMAGE_TASK')
	const fileNames = [ ...new Set(tasks.map((row) => taskImageFileName(text(row.image, `task ${row.id}.image`), row.id)).filter((value): value is string => Boolean(value))) ]
	for (const fileName of fileNames) {
		const source = join(sourceDirectory, fileName)
		if (!(await stat(source)).isFile()) throw new Error(`Catalog asset is not a file: ${fileName}`)
	}
	await mkdir(destinationDirectory, { recursive: true })
	for (const fileName of fileNames) await copyFile(join(sourceDirectory, fileName), join(destinationDirectory, fileName))
	return fileNames.length
}

async function main(): Promise<void> {
	requirePreviewConfirmation('PREVIEW_CATALOG_IMPORT_CONFIRMED')
	await assertPreviewDatabase(prisma)
	const snapshotDirectory = requireEnvironment('CATALOG_SNAPSHOT_DIR')
	const [coursesRaw, categoriesRaw, tasksRaw, linksRaw, manualsRaw, licensesRaw] = await Promise.all([
		readSnapshot(snapshotDirectory, 'course.json'),
		readSnapshot(snapshotDirectory, 'task-category.json'),
		readSnapshot(snapshotDirectory, 'task.json'),
		readSnapshot(snapshotDirectory, 'category-task-links.json'),
		readSnapshot(snapshotDirectory, 'manuals.json', false),
		readSnapshot(snapshotDirectory, 'licenses.json', false),
	])
	distinctIds(coursesRaw, 'course.json')
	distinctIds(categoriesRaw, 'task-category.json')
	distinctIds(tasksRaw, 'task.json')
	distinctIds(manualsRaw, 'manuals.json')
	const courses = coursesRaw as CourseRow[]
	const categories = categoriesRaw as CategoryRow[]
	const tasks = tasksRaw as TaskRow[]
	const linkGroups = linksRaw as TaskLinksRow[]
	const catalogCourseLinks = courseLinks(courses)
	const catalogCategoryLinks = categoryLinks(categories)
	const catalogTaskLinks = taskLinks(linkGroups)
	const copiedAssetCount = await copyCatalogAssets(tasks)
	assertDistinctPairs(catalogCourseLinks, 'course-category relations')
	assertDistinctPairs(catalogCategoryLinks, 'category hierarchy relations')
	assertDistinctPairs(catalogTaskLinks, 'category-task relations')
	const categoryIds = new Set(categories.map((row) => integer(row.id, 'task-category.json.id')))
	const taskIds = new Set(tasks.map((row) => integer(row.id, 'task.json.id')))
	for (const link of catalogTaskLinks) {
		if (!categoryIds.has(integer(link.categoryId, 'category-task-links.json.categoryId')) || !taskIds.has(integer(link.taskId, 'category-task-links.json.taskId'))) {
			throw new Error('category-task-links.json references a missing category or task')
		}
	}
	for (const link of catalogCourseLinks) if (!categoryIds.has(link.categoryId)) throw new Error('course.json references a missing category')
	for (const link of catalogCategoryLinks) {
		if (!categoryIds.has(link.parentId) || !categoryIds.has(link.childrenId)) {
			throw new Error('task-category.json hierarchy references a missing category')
		}
	}
	const expected = {
		course: courses.map((row) => row.id).sort((a, b) => a - b),
		category: categories.map((row) => row.id).sort((a, b) => a - b),
		task: tasks.map((row) => row.id).sort((a, b) => a - b),
		manual: manualsRaw.map((row) => integer(row.id, 'manual.id')).sort((a, b) => a - b),
	}
	const existing = await Promise.all([
		prisma.course.findMany({ select: { id: true }, orderBy: { id: 'asc' } }),
		prisma.taskCategory.findMany({ select: { id: true }, orderBy: { id: 'asc' } }),
		prisma.task.findMany({ select: { id: true }, orderBy: { id: 'asc' } }),
		prisma.manual.findMany({ select: { id: true }, orderBy: { id: 'asc' } }),
		prisma.courseToCategory.count(),
		prisma.categoryToCategory.count(),
		prisma.categoryToTask.count(),
	])
	if (sameIds(existing[0].map((row) => row.id), expected.course)
		&& sameIds(existing[1].map((row) => row.id), expected.category)
		&& sameIds(existing[2].map((row) => row.id), expected.task)
		&& sameIds(existing[3].map((row) => row.id), expected.manual)
		&& existing[4] === catalogCourseLinks.length
		&& existing[5] === catalogCategoryLinks.length
		&& existing[6] === catalogTaskLinks.length) {
		console.log(`Catalog snapshot is already present; verified ${copiedAssetCount} public task images.`)
		return
	}

	await assertEmptyCatalog(prisma)
	await prisma.$transaction([
		prisma.license.createMany({ data: licensesRaw.map((row) => ({ id: integer(row.id, 'license.id'), name: text(row.name, 'license.name'), description: row.description == null ? null : text(row.description, 'license.description'), price: integer(row.price, 'license.price'), duration: integer(row.duration, 'license.duration'), freeCourses: integer(row.freeCourses, 'license.freeCourses'), courses: row.courses == null ? null : text(row.courses, 'license.courses') })) }),
		prisma.course.createMany({ data: courses.map((row) => ({ id: integer(row.id, 'course.id'), name: text(row.name, 'course.name'), description: text(row.description, 'course.description'), date: optionalDate(row.date, 'course.date'), deleted: optionalBoolean(row.deleted, false, 'course.deleted'), visible: optionalBoolean(row.visible, true, 'course.visible') })) }),
		prisma.taskCategory.createMany({ data: categories.map((row) => ({ id: integer(row.id, 'task-category.id'), name: text(row.name, 'task-category.name'), description: text(row.description, 'task-category.description'), date: optionalDate(row.date, 'task-category.date'), deleted: optionalBoolean(row.deleted, false, 'task-category.deleted') })) }),
		prisma.task.createMany({ data: tasks.map((row) => ({ id: integer(row.id, 'task.id'), name: text(row.name, 'task.name'), description: text(row.description, 'task.description'), instruction: text(row.instruction, 'task.instruction'), image: text(row.image, 'task.image'), complexity: row.complexity === undefined ? 1 : integer(row.complexity, 'task.complexity'), date: optionalDate(row.date, 'task.date'), deleted: optionalBoolean(row.deleted, false, 'task.deleted') })) }),
		prisma.manual.createMany({ data: manualsRaw.map((row) => ({ id: integer(row.id, 'manual.id'), name: text(row.name, 'manual.name'), html: text(row.html, 'manual.html'), date: optionalDate(row.date, 'manual.date'), deleted: optionalBoolean(row.deleted, false, 'manual.deleted') })) }),
		prisma.courseToCategory.createMany({ data: catalogCourseLinks }),
		prisma.categoryToCategory.createMany({ data: catalogCategoryLinks }),
		prisma.categoryToTask.createMany({ data: catalogTaskLinks }),
	])
	console.log(`Imported ${courses.length} courses, ${categories.length} categories, ${tasks.length} tasks, ${manualsRaw.length} manuals, and ${copiedAssetCount} public task images.`)
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
}).finally(() => prisma.$disconnect())
