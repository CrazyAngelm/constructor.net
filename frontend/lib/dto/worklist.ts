export interface WorklistDto {
	id: string
	name?: string
	json?: string
}

export interface CreateWorklistInFolderDto {
	name?: string
	json?: string
	folderId: string
}

export interface CreateWorklistInCourse {
	name?: string
	json?: string
	courseId: number
}

export interface FolderDto {
	id?: string,
	name?: string
}

export interface CreateFolderDto {
	name: string
	parentFolderId?: string
	parentCourseId?: number
}
