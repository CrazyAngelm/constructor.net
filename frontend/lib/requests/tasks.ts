import { TaskCategoryDto, TaskDto } from '../dto/tasks'

import { RequestWithContext, RequestContext, defaultRequestContext, handleNonOk } from './shared'

export const getTaskCategories: RequestWithContext<unknown, TaskCategoryDto[]> = async (
	_?: unknown,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<TaskCategoryDto[]> => {
	const res = await fetch(apiUrl + '/task-category')
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
