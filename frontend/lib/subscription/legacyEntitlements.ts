import { Prisma } from '@prisma/client'

// Older desktop/site versions read the stored course arrays and do not know
// unlimitedCourses. Keep those arrays compatible without imposing a new cap.
export const synchronizeUnlimitedCourses = async (tx: Prisma.TransactionClient) => {
	const courses = await tx.course.findMany({ where: { deleted: false, visible: true }, select: { id: true }, orderBy: { id: 'asc' } })
	const ids = JSON.stringify(courses.map(course => course.id))
	const licenses = await tx.license.findMany({ where: { unlimitedCourses: true }, select: { id: true } })
	await tx.license.updateMany({ where: { id: { in: licenses.map(license => license.id) } }, data: { courses: ids } })
}
