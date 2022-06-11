export interface CourseDto {
	id: number
	name?: string
	description?: string
	taskCategoriesId?: number[]
}

export interface TaskCategoryDto {
	id: number
	name?: string
	description?: string
	courseId?: number
	tasksId?: number[]
}

export interface TaskDto {
	id: number
	name?: string
	description?: string
	image?: string
	taskCategoryId?: number
}
