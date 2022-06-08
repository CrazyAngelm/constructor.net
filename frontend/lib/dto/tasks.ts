export interface TaskCategoryDto {
	id: number
	name?: string
	description?: string
	tasksId?: number[]
}

export interface TaskDto {
	id: number
	name?: string
	description?: string
	image?:string
	taskCategoryId?: number
}
