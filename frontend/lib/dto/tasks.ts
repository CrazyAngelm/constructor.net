export interface CourseDto {
	id: number
	name?: string
	description?: string
}

export interface TaskCategoryDto {
	id: number
	name?: string
	description?: string
}
export interface CreateCategoryDto {
	parentId: number,
	courseParent?: boolean,
}

export interface TaskDto {
	id: number
	categories?: number[]
	name?: string
	description?: string
	instruction?: string
	image?: string
}

export interface RequestIds {
	id: number[]
}

export interface Status {
	status: string
}
