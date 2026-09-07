import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { getStudioCatalogAccess } from '@/lib/studio/access'
import { collectDescendantCategoryIds } from '@/lib/studio/catalog'

const prisma = getPrisma()
const handler = getDefaultHandler()

handler.get(responseAuth(async (_req, _res, userId) => {
	const access = await getStudioCatalogAccess(prisma, userId)
	if (!access) return { error: { code: 403, message: 'Требуется действующая подписка или пробный период' } }
	const courses = await prisma.course.findMany({
		where: {
			deleted: false,
			visible: true,
			...(access.isAdmin ? {} : { id: { in: access.courseIds } }),
		},
		select: {
			id: true,
			name: true,
			description: true,
			CourseToCategory: {
				select: { categoryId: true },
				orderBy: { categoryId: 'asc' },
			},
			FolderToCourse: {
				where: { folder: { deleted: false, visible: true } },
				include: { folder: true },
				orderBy: { folderId: 'asc' },
			},
		},
		orderBy: { id: 'asc' },
	})
	const categories = await prisma.taskCategory.findMany({
		where: { deleted: false, visible: true },
		select: {
			id: true,
			name: true,
			description: true,
			CategoryParent: {
				select: { childrenId: true },
				orderBy: { childrenId: 'asc' },
			},
			CategoryToTask: {
				where: { task: { deleted: false } },
				select: { task: true },
				orderBy: { taskId: 'asc' },
			},
		},
		orderBy: { id: 'asc' },
	})
	const byId = new Map(categories.map((category) => [category.id, category]))
	const categoryTree = categories.map((category) => ({
		id: category.id,
		childrenIds: category.CategoryParent.map((relation) => relation.childrenId),
	}))
	return {
		response: {
			courses: courses.map((course) => ({
				id: course.id,
				name: course.name,
				description: course.description,
				folders: course.FolderToCourse.map(({ folder }) => ({ id: folder.id, name: folder.name })),
				categories: collectDescendantCategoryIds(course.CourseToCategory.map((item) => item.categoryId), categoryTree)
					.map((categoryId) => byId.get(categoryId))
					.filter((category): category is NonNullable<typeof category> => Boolean(category))
					.map((category) => ({
						id: category.id,
						name: category.name,
						description: category.description,
						tasks: category.CategoryToTask.map(({ task }) => task),
					})),
			})),
		},
	}
}))

export default handler
