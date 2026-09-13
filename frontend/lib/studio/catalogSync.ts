import { Prisma, PrismaClient } from '@prisma/client'
import { mkdir, rename, stat, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

import { assertPreviewDatabase, requireEnvironment } from '../../scripts/preview-guard'

type IdRow<T extends number | string> = { id: T }

interface SourceCourse extends IdRow<number> {
	name: string
	description: string
	date: string | null
	visible?: boolean
	categories: number[]
}

interface SourceCategory extends IdRow<number> {
	name: string
	description: string
	date: string | null
	visible?: boolean
	CategoryChildren: Array<{ parentId: number; childrenId: number }>
}

interface SourceTask extends IdRow<number> {
	name: string
	description: string
	instruction: string
	image: string
	complexity: number
	date: string | null
}

interface SourceFolder extends IdRow<string> {
	name: string
	date: string
	visible?: boolean
}

export interface CatalogSnapshot {
	courses: SourceCourse[]
	categories: SourceCategory[]
	tasks: SourceTask[]
	folders: SourceFolder[]
	courseCategoryLinks: Array<{ courseId: number; categoryId: number }>
	categoryCategoryLinks: Array<{ parentId: number; childrenId: number }>
	categoryTaskLinks: Array<{ categoryId: number; taskId: number }>
	folderCourseLinks: Array<{ folderId: string; courseId: number }>
}

interface CatalogIds {
	courses: Array<IdRow<number>>
	categories: Array<IdRow<number>>
	tasks: Array<IdRow<number>>
	folders: Array<IdRow<string>>
}

export interface CatalogSyncPlan {
	staleCourseIds: number[]
	staleCategoryIds: number[]
	staleTaskIds: number[]
	staleFolderIds: string[]
}

export interface CatalogSyncResult {
	courses: number
	categories: number
	tasks: number
	removedTasks: number
	copiedImages: number
}

const staleIds = <T extends number | string>(source: Array<IdRow<T>>, current: Array<IdRow<T>>): T[] => {
	const active = new Set(source.map(({ id }) => id))
	return current.map(({ id }) => id).filter(id => !active.has(id)).sort((a, b) => String(a).localeCompare(String(b), 'en', { numeric: true }))
}

export const buildCatalogSyncPlan = (source: CatalogIds, current: CatalogIds): CatalogSyncPlan => ({
	staleCourseIds: staleIds(source.courses, current.courses),
	staleCategoryIds: staleIds(source.categories, current.categories),
	staleTaskIds: staleIds(source.tasks, current.tasks),
	staleFolderIds: staleIds(source.folders, current.folders),
})

const sourceUrl = (value: string): URL => {
	const url = new URL(value)
	if (![ 'http:', 'https:' ].includes(url.protocol) || ![ '127.0.0.1', 'localhost', '::1' ].includes(url.hostname)) {
		throw new Error('Catalog source URL must use an HTTP loopback address')
	}
	url.pathname = url.pathname.replace(/\/$/, '') + '/'
	url.search = ''
	url.hash = ''
	return url
}

const asArray = (value: unknown, path: string): Array<Record<string, unknown>> => {
	const rows = Array.isArray(value) ? value : (value as { response?: unknown } | null)?.response
	if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
		throw new Error(`Catalog source returned invalid data for ${path}`)
	}
	return rows as Array<Record<string, unknown>>
}

const integer = (value: unknown, label: string): number => {
	if (!Number.isSafeInteger(value) || Number(value) < 1) throw new Error(`${label} must be a positive integer`)
	return Number(value)
}

const nonNegativeInteger = (value: unknown, label: string): number => {
	if (!Number.isSafeInteger(value) || Number(value) < 0) throw new Error(`${label} must be a non-negative integer`)
	return Number(value)
}

const text = (value: unknown, label: string): string => {
	if (typeof value !== 'string') throw new Error(`${label} must be a string`)
	return value
}

const nullableDate = (value: unknown, label: string): string | null => {
	if (value === null || value === undefined || value === '') return null
	const parsed = new Date(text(value, label))
	if (Number.isNaN(parsed.getTime())) throw new Error(`${label} must be a date`)
	return parsed.toISOString()
}

const requiredDate = (value: unknown, label: string): string => {
	const parsed = nullableDate(value, label)
	if (!parsed) throw new Error(`${label} is required`)
	return parsed
}

const optionalVisibility = (value: unknown, label: string): boolean | undefined => {
	if (value === undefined) return undefined
	if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean`)
	return value
}

const fetchRows = async (base: URL, path: string, fetcher: typeof fetch): Promise<Array<Record<string, unknown>>> => {
	const response = await fetcher(new URL(path.replace(/^\//, ''), base), { cache: 'no-store' })
	if (!response.ok) throw new Error(`Catalog source request failed for ${path}: HTTP ${response.status}`)
	return asArray(await response.json(), path)
}

const distinct = <T extends number | string>(values: T[], label: string): T[] => {
	if (new Set(values).size !== values.length) throw new Error(`${label} contains duplicates`)
	return values
}

export const fetchCatalogSnapshot = async (baseValue: string, fetcher: typeof fetch = fetch): Promise<CatalogSnapshot> => {
	const base = sourceUrl(baseValue)
	const [ courseRows, categoryRows, taskRows ] = await Promise.all([
		fetchRows(base, '/api/course', fetcher),
		fetchRows(base, '/api/task-category', fetcher),
		fetchRows(base, '/api/task', fetcher),
	])
	const courses = courseRows.map((row, index): SourceCourse => ({
		id: integer(row.id, `course[${index}].id`),
		name: text(row.name, `course[${index}].name`),
		description: text(row.description, `course[${index}].description`),
		date: nullableDate(row.date, `course[${index}].date`),
		visible: optionalVisibility(row.visible, `course[${index}].visible`),
		categories: Array.isArray(row.categories) ? row.categories.map((id, itemIndex) => integer(id, `course[${index}].categories[${itemIndex}]`)) : [],
	}))
	const categories = categoryRows.map((row, index): SourceCategory => ({
		id: integer(row.id, `category[${index}].id`),
		name: text(row.name, `category[${index}].name`),
		description: text(row.description, `category[${index}].description`),
		date: nullableDate(row.date, `category[${index}].date`),
		visible: optionalVisibility(row.visible, `category[${index}].visible`),
		CategoryChildren: Array.isArray(row.CategoryChildren) ? row.CategoryChildren.map((relation, relationIndex) => {
			if (!relation || typeof relation !== 'object' || Array.isArray(relation)) throw new Error(`category[${index}].CategoryChildren[${relationIndex}] is invalid`)
			return {
				parentId: integer((relation as Record<string, unknown>).parentId, `category[${index}].CategoryChildren[${relationIndex}].parentId`),
				childrenId: integer((relation as Record<string, unknown>).childrenId, `category[${index}].CategoryChildren[${relationIndex}].childrenId`),
			}
		}) : [],
	}))
	const tasks = taskRows.map((row, index): SourceTask => ({
		id: integer(row.id, `task[${index}].id`),
		name: text(row.name, `task[${index}].name`),
		description: text(row.description, `task[${index}].description`),
		instruction: text(row.instruction, `task[${index}].instruction`),
		image: text(row.image, `task[${index}].image`),
		complexity: nonNegativeInteger(row.complexity, `task[${index}].complexity`),
		date: nullableDate(row.date, `task[${index}].date`),
	}))
	distinct(courses.map(({ id }) => id), 'courses')
	distinct(categories.map(({ id }) => id), 'categories')
	distinct(tasks.map(({ id }) => id), 'tasks')

	const categoryTaskLinks: CatalogSnapshot['categoryTaskLinks'] = []
	for (const category of categories) {
		const linked = await fetchRows(base, `/api/task-category/${category.id}/tasks`, fetcher)
		for (const row of linked) categoryTaskLinks.push({ categoryId: category.id, taskId: integer(row.id, `category ${category.id} task.id`) })
	}
	const folderMap = new Map<string, SourceFolder>()
	const folderCourseLinks: CatalogSnapshot['folderCourseLinks'] = []
	for (const course of courses) {
		const linked = await fetchRows(base, `/api/course/${course.id}/folders`, fetcher)
		for (const [ index, row ] of linked.entries()) {
			const folder: SourceFolder = {
				id: text(row.id, `course ${course.id} folder[${index}].id`),
				name: text(row.name, `course ${course.id} folder[${index}].name`),
				date: requiredDate(row.date, `course ${course.id} folder[${index}].date`),
				visible: optionalVisibility(row.visible, `course ${course.id} folder[${index}].visible`),
			}
			folderMap.set(folder.id, folder)
			folderCourseLinks.push({ folderId: folder.id, courseId: course.id })
		}
	}

	const courseCategoryLinks = courses.flatMap(course => course.categories.map(categoryId => ({ courseId: course.id, categoryId })))
	const categoryCategoryLinks = categories.flatMap(category => category.CategoryChildren)
	const courseIds = new Set(courses.map(({ id }) => id))
	const categoryIds = new Set(categories.map(({ id }) => id))
	const taskIds = new Set(tasks.map(({ id }) => id))
	for (const relation of courseCategoryLinks) if (!courseIds.has(relation.courseId) || !categoryIds.has(relation.categoryId)) throw new Error('Course-category relation references an inactive record')
	for (const relation of categoryCategoryLinks) if (!categoryIds.has(relation.parentId) || !categoryIds.has(relation.childrenId)) throw new Error('Category hierarchy references an inactive record')
	for (const relation of categoryTaskLinks) if (!categoryIds.has(relation.categoryId) || !taskIds.has(relation.taskId)) throw new Error('Category-task relation references an inactive record')
	distinct(courseCategoryLinks.map(link => `${link.courseId}:${link.categoryId}`), 'course-category relations')
	distinct(categoryCategoryLinks.map(link => `${link.parentId}:${link.childrenId}`), 'category hierarchy')
	distinct(categoryTaskLinks.map(link => `${link.categoryId}:${link.taskId}`), 'category-task relations')
	distinct(folderCourseLinks.map(link => `${link.folderId}:${link.courseId}`), 'folder-course relations')

	return { courses, categories, tasks, folders: [ ...folderMap.values() ], courseCategoryLinks, categoryCategoryLinks, categoryTaskLinks, folderCourseLinks }
}

const imageFileName = (image: string, taskId: number): string | null => {
	if (!image) return null
	const prefix = '/uploads/task/'
	if (!image.startsWith(prefix)) throw new Error(`Task ${taskId} uses an unsupported image path`)
	const fileName = image.slice(prefix.length)
	if (!fileName || basename(fileName) !== fileName || fileName.includes('\0')) throw new Error(`Task ${taskId} uses an unsafe image path`)
	return fileName
}

const existsAsFile = async (path: string): Promise<boolean> => {
	try { return (await stat(path)).isFile() } catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
		throw error
	}
}

const copyMissingImages = async (snapshot: CatalogSnapshot, baseValue: string, destination: string): Promise<number> => {
	const base = sourceUrl(baseValue)
	const names = new Map<string, number>()
	for (const task of snapshot.tasks) {
		const fileName = imageFileName(task.image, task.id)
		if (fileName) names.set(fileName, task.id)
	}
	await mkdir(destination, { recursive: true })
	let copied = 0
	for (const [ fileName, taskId ] of names) {
		const target = join(destination, fileName)
		if (await existsAsFile(target)) continue
		const response = await fetch(new URL(`/uploads/task/${encodeURIComponent(fileName)}`, base))
		if (!response.ok) throw new Error(`Catalog image for task ${taskId} is unavailable: HTTP ${response.status}`)
		const temporary = `${target}.${process.pid}.catalog-sync`
		await writeFile(temporary, Buffer.from(await response.arrayBuffer()))
		await rename(temporary, target)
		copied += 1
	}
	return copied
}

export const synchronizeCatalog = async (prisma: PrismaClient): Promise<CatalogSyncResult> => {
	await assertPreviewDatabase(prisma)
	const source = requireEnvironment('CATALOG_SOURCE_URL')
	const snapshot = await fetchCatalogSnapshot(source)
	const [ courses, categories, tasks, catalogFolders ] = await Promise.all([
		prisma.course.findMany({ where: { deleted: false }, select: { id: true, visible: true } }),
		prisma.taskCategory.findMany({ where: { deleted: false }, select: { id: true, visible: true } }),
		prisma.task.findMany({ where: { deleted: false }, select: { id: true } }),
		prisma.folderToCourse.findMany({ distinct: [ 'folderId' ], select: { folder: { select: { id: true, visible: true } } } }),
	])
	const current = { courses, categories, tasks, folders: catalogFolders.map(({ folder }) => folder) }
	const plan = buildCatalogSyncPlan(snapshot, current)
	const copiedImages = await copyMissingImages(snapshot, source, requireEnvironment('UPLOAD_IMAGE_TASK'))
	const categoryVisibility = new Map(categories.map(row => [ row.id, row.visible ]))
	const operations: Prisma.PrismaPromise<unknown>[] = [
		prisma.courseToCategory.deleteMany(),
		prisma.categoryToCategory.deleteMany(),
		prisma.categoryToTask.deleteMany(),
		prisma.folderToCourse.deleteMany(),
		prisma.taskCategory.deleteMany(),
		prisma.task.deleteMany(),
		prisma.course.updateMany({ data: { deleted: true } }),
	]
	for (const course of snapshot.courses) operations.push(prisma.course.upsert({
		where: { id: course.id },
		create: { id: course.id, name: course.name, description: course.description, date: course.date ? new Date(course.date) : null, deleted: false, visible: course.visible ?? true },
		update: { name: course.name, description: course.description, date: course.date ? new Date(course.date) : null, deleted: false },
	}))
	if (current.folders.length) operations.push(prisma.folder.updateMany({ where: { id: { in: current.folders.map(({ id }) => id) } }, data: { deleted: true } }))
	for (const folder of snapshot.folders) operations.push(prisma.folder.upsert({
		where: { id: folder.id },
		create: { id: folder.id, name: folder.name, date: new Date(folder.date), deleted: false, visible: folder.visible ?? true },
		update: { name: folder.name, date: new Date(folder.date), deleted: false },
	}))
	operations.push(
		prisma.taskCategory.createMany({ data: snapshot.categories.map(category => ({ id: category.id, name: category.name, description: category.description, date: category.date ? new Date(category.date) : null, deleted: false, visible: categoryVisibility.get(category.id) ?? category.visible ?? true })) }),
		prisma.task.createMany({ data: snapshot.tasks.map(task => ({ id: task.id, name: task.name, description: task.description, instruction: task.instruction, image: task.image, complexity: task.complexity, date: task.date ? new Date(task.date) : null, deleted: false })) }),
		prisma.courseToCategory.createMany({ data: snapshot.courseCategoryLinks }),
		prisma.categoryToCategory.createMany({ data: snapshot.categoryCategoryLinks }),
		prisma.categoryToTask.createMany({ data: snapshot.categoryTaskLinks }),
		prisma.folderToCourse.createMany({ data: snapshot.folderCourseLinks }),
	)
	await prisma.$transaction(operations)
	return { courses: snapshot.courses.length, categories: snapshot.categories.length, tasks: snapshot.tasks.length, removedTasks: plan.staleTaskIds.length, copiedImages }
}
