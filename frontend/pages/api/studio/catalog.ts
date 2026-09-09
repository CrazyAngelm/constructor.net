import { getDefaultHandler } from '@/lib/api/apiHandler'
import { getPrisma } from '@/lib/api/database'
import { responseAuth } from '@/lib/api/response'
import { getStudioCatalogAccess } from '@/lib/studio/access'
import { buildCategoryForest, collectDescendantCategoryIds, selectRootCategoryIds } from '@/lib/studio/catalog'

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
				select: { task: { select: {
					id: true,
					name: true,
					description: true,
					instruction: true,
					complexity: true,
					image: true,
				} } },
				orderBy: { taskId: 'asc' },
			},
		},
		orderBy: { id: 'asc' },
	})
	const byId = new Map(categories.map((category) => [ category.id, category ]))
	const categoryTree = categories.map((category) => ({
		id: category.id,
		childrenIds: category.CategoryParent.map((relation) => relation.childrenId),
	}))
	const categoryData = categories.map(category => ({
		id: category.id,
		name: category.name,
		description: category.description,
		childrenIds: category.CategoryParent.map(relation => relation.childrenId),
		tasks: category.CategoryToTask.map(({ task }) => task),
	}))
	return {
		response: {
			courses: courses.map((course) => {
				const linkedIds = course.CourseToCategory.map(item => item.categoryId)
				const rootIds = selectRootCategoryIds(linkedIds, categoryTree)
				return {
				id: course.id,
				name: course.name,
				description: course.description,
				folders: course.FolderToCourse.map(({ folder }) => ({ id: folder.id, name: folder.name })),
				categoryTree: buildCategoryForest(rootIds, categoryData),
				categories: collectDescendantCategoryIds(rootIds, categoryTree)
					.map((categoryId) => byId.get(categoryId))
					.filter((category): category is NonNullable<typeof category> => Boolean(category))
					.map((category) => ({
						id: category.id,
						name: category.name,
						description: category.description,
						tasks: category.CategoryToTask.map(({ task }) => task),
					})),
				}
			}),
		},
	}
}))

export default handler
