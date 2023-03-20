export interface WorklistDto {
	id: string
	name?: string
	json?: string
}

export interface CreateWorklistInCategoryDto {
	name?: string
	json?: string
	categoryId: number
}

export interface CreateWorklistInCourse {
	name?: string
	json?: string
	courseId: number
}
