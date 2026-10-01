import { PrismaClient, Prisma } from '@prisma/client'
import { StudioCatalogAccess } from './access'

export const publishedProgramFilter = (access: StudioCatalogAccess): Prisma.StudioWorklistWhereInput => ({
	published: true,
	course: { deleted: false, visible: true, ...(access.isAdmin ? {} : { id: { in: access.courseIds } }) },
})

// Desktop programs can sit several folders below a course. Resolve the complete
// folder tree, using the same course entitlement as the web catalog.
export const accessibleLegacyPrograms = async (prisma: PrismaClient, access: StudioCatalogAccess) => {
	const courses = await prisma.course.findMany({
		where: { deleted: false, visible: true, ...(access.isAdmin ? {} : { id: { in: access.courseIds } }) },
		select: { id: true, name: true, CourseToWorklist: { select: { worklistId: true } }, FolderToCourse: { select: { folderId: true } } },
	})
	const folders = await prisma.folder.findMany({ where: { deleted: false, visible: true }, select: { id: true, name: true, FolderChildren: { select: { childrenId: true } }, FolderToWorklist: { select: { worklistId: true } } } })
	const byId = new Map(folders.map(folder => [folder.id, folder]))
	const result = new Map<string, { courseId: number; courseName: string; folderName?: string }>()
	for (const course of courses) {
		for (const link of course.CourseToWorklist) result.set(link.worklistId, { courseId: course.id, courseName: course.name })
		const seen = new Set<string>()
		const visit = (id: string, parent = '') => {
			if (seen.has(id)) return
			seen.add(id)
			const folder = byId.get(id)
			if (!folder) return
			const path = parent ? `${parent} → ${folder.name}` : folder.name
			for (const link of folder.FolderToWorklist) result.set(link.worklistId, { courseId: course.id, courseName: course.name, folderName: path })
			for (const child of folder.FolderChildren) visit(child.childrenId, path)
		}
		for (const folder of course.FolderToCourse) visit(folder.folderId)
	}
	return result
}
