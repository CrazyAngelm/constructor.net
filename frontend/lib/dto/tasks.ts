export interface CourseDto {
	id: number
	name?: string
	description?: string
}

export interface TaskCategoryDto {
	id: number
	name?: string
	description?: string
	courses?: number[]
}

export interface TaskDto {
	id: number
	name?: string
	description?: string
	instruction?: string
	image?: string
	categpries?: number[]
}

export interface RequestIds {
	id: number[]
}

export interface Status {
	status: string
}
