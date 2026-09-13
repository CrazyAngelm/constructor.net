import { describe, expect, it } from 'vitest'
import { buildCatalogSyncPlan, fetchCatalogSnapshot } from './catalogSync'

describe('catalog synchronization', () => {
	it('marks preview records missing from the active source as stale', () => {
		const plan = buildCatalogSyncPlan({
			courses: [ { id: 1 } ],
			categories: [ { id: 10 } ],
			tasks: [ { id: 100 }, { id: 101 } ],
			folders: [ { id: 'folder-a' } ],
		}, {
			courses: [ { id: 1 }, { id: 2 } ],
			categories: [ { id: 10 }, { id: 11 } ],
			tasks: [ { id: 100 }, { id: 101 }, { id: 102 } ],
			folders: [ { id: 'folder-a' }, { id: 'folder-b' } ],
		})

		expect(plan).toEqual({
			staleCourseIds: [ 2 ],
			staleCategoryIds: [ 11 ],
			staleTaskIds: [ 102 ],
			staleFolderIds: [ 'folder-b' ],
		})
	})

	it('builds a validated snapshot from the public main-site catalog API', async () => {
		const responses = new Map<string, unknown>([
			[ '/api/course', [ { id: 1, name: 'Курс', description: '', categories: [ 10 ] } ] ],
			[ '/api/task-category', [ { id: 10, name: 'Раздел', description: '', CategoryChildren: [] } ] ],
			[ '/api/task', [ { id: 100, name: 'Упражнение', description: '', instruction: 'Текст', image: '', complexity: 1 } ] ],
			[ '/api/course/1/folders', [ { id: 'folder-a', name: 'Папка', date: '2026-09-13T00:00:00.000Z', deleted: false } ] ],
			[ '/api/task-category/10/tasks', [ { id: 100, name: 'Упражнение' } ] ],
		])
		const requested: string[] = []
		const fetcher = async (input: string | URL | Request) => {
			const url = new URL(String(input))
			requested.push(url.pathname)
			const value = responses.get(url.pathname)
			return value === undefined
				? new Response('not found', { status: 404 })
				: Response.json(value)
		}

		const snapshot = await fetchCatalogSnapshot('http://127.0.0.1:3000', fetcher as typeof fetch)

		expect(snapshot.courseCategoryLinks).toEqual([ { courseId: 1, categoryId: 10 } ])
		expect(snapshot.categoryTaskLinks).toEqual([ { categoryId: 10, taskId: 100 } ])
		expect(snapshot.folderCourseLinks).toEqual([ { folderId: 'folder-a', courseId: 1 } ])
		expect(requested).toContain('/api/task-category/10/tasks')
	})

	it('refuses a non-loopback source URL', async () => {
		await expect(fetchCatalogSnapshot('https://example.com', fetch)).rejects.toThrow('loopback')
	})
})
