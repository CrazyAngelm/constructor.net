import { CourseDto, CreateCategoryDto, RequestIds, Status, TaskCategoryDto, TaskDto } from '../dto/tasks'

import { RequestWithContext, RequestContext, defaultRequestContext, handleNonOk } from './shared'

export const getCourses: RequestWithContext<unknown, CourseDto[]> = async (
	_?: unknown,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<CourseDto[]> => {
	const res = await fetch(apiUrl + 'course')
	handleNonOk(res)
	const json = await res.json()

	return json
}

export const getCourseById: RequestWithContext<number, CourseDto> = async (
	id: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<CourseDto> => {
	const res = await fetch(apiUrl + '/course/' + encodeURIComponent(id))

	await handleNonOk(res)

	const json = await res.json()

	return json
}

export const updateCourse = async (
	id: number,
	dto: CourseDto,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<CourseDto> => {
	const res = await fetch(apiUrl + `/course/${encodeURIComponent(id)}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(dto),
	})

	await handleNonOk(res)

	return await res.json()
}

export const removeCourse = async (
	id: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<{}> => {
	const res = await fetch(apiUrl + `/course/${encodeURIComponent(id)}`, {
		method: 'PUT',
	})

	await handleNonOk(res)

	return await res.json()
}

export const getTaskCategories: RequestWithContext<unknown, TaskCategoryDto[]> = async (
	_?: unknown,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<TaskCategoryDto[]> => {
	const res = await fetch(apiUrl + '/task-category')
	handleNonOk(res)
	const json = await res.json()

	return json
}

export const getTaskCategoriesByIdCourse: RequestWithContext<number, TaskCategoryDto[]> = async (
	id: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<TaskCategoryDto[]> => {
	const res = await fetch(apiUrl + `/course/${encodeURIComponent(id)}/categories`)
	handleNonOk(res)
	const json = await res.json()

	return json
}

export const getTaskCategoriesByIdCategory: RequestWithContext<number, TaskCategoryDto[]> = async (
	id: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<TaskCategoryDto[]> => {
	const res = await fetch(apiUrl + '/task-category/' + encodeURIComponent(id) + '/categories')
	handleNonOk(res)
	const json = await res.json()

	return json
}

export const getTaskCategoryById: RequestWithContext<number, TaskCategoryDto> = async (
	id: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<TaskCategoryDto> => {
	const res = await fetch(apiUrl + '/task-category/' + encodeURIComponent(id))

	await handleNonOk(res)

	const json = await res.json()

	return json
}

export const updateTaskCategory = async (
	id: number,
	dto: TaskCategoryDto,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<TaskCategoryDto> => {
	const res = await fetch(apiUrl + `/task-category/${encodeURIComponent(id)}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(dto),
	})

	await handleNonOk(res)

	return await res.json()
}

export const removeTaskCategory = async (
	id: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<{}> => {
	const res = await fetch(apiUrl + `/task-category/${encodeURIComponent(id)}`, {
		method: 'PUT',
	})

	await handleNonOk(res)

	return await res.json()
}

export const createTaskCategory = async (
	parentId: number,
	parentCourse?: boolean,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<TaskCategoryDto> => {
	const res = await fetch(apiUrl + `/task-category/create`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			parentId: parentId,
			courseParent: parentCourse
		} as CreateCategoryDto),
	})

	await handleNonOk(res)

	return await res.json()
}

export const getTasks: RequestWithContext<unknown, TaskDto[]> = async (
	_?: unknown,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<TaskDto[]> => {
	const res = await fetch(apiUrl + '/task')
	handleNonOk(res)
	const json = await res.json()

	return json
}

export const getTasksByIdCategory: RequestWithContext<number, TaskDto[]> = async (
	id: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<TaskDto[]> => {
	const res = await fetch(apiUrl + '/task-category/' + encodeURIComponent(id) + '/tasks')

	await handleNonOk(res)

	const json = await res.json()

	return json
}

export const getTaskById: RequestWithContext<number, TaskDto> = async (
	id: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<TaskDto> => {
	const res = await fetch(apiUrl + '/task/' + encodeURIComponent(id))

	await handleNonOk(res)

	const json = await res.json()

	return json
}

export const updateTask = async (
	id: number,
	dto: TaskDto,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<TaskDto> => {
	const res = await fetch(apiUrl + `/task/${encodeURIComponent(id)}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(dto),
	})

	await handleNonOk(res)

	return await res.json()
}

export const removeTask = async (
	id: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<{}> => {
	const res = await fetch(apiUrl + `/task/${encodeURIComponent(id)}`, {
		method: 'PUT',
	})

	await handleNonOk(res)

	return await res.json()
}

export const updateCategoriesForTask = async (
	id: number,
	dto: RequestIds,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Status> => {
	const res = await fetch(apiUrl + `/task/${encodeURIComponent(id)}/category`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(dto),
	})

	await handleNonOk(res)

	return await res.json()
}

export const getTaskCategoriesByIdTask: RequestWithContext<number, TaskCategoryDto[]> = async (
	id: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<TaskCategoryDto[]> => {
	const res = await fetch(apiUrl + `/task/${encodeURIComponent(id)}/category`)
	handleNonOk(res)
	const json = await res.json()

	return json
}

export const uploadTaskImage = async (
	id: number,
	data: FormData,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Status> => {
	const res = await fetch(apiUrl + `/task/${encodeURIComponent(id)}/image`, {
		method: 'POST',
		body: data,
	})

	await handleNonOk(res)

	return await res.json()
}

