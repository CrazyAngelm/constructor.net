import { WorklistDto } from '../dto/worklist'
import { defaultRequestContext, handleNonOk, RequestContext, RequestWithContext } from './shared'

export const getWorklistsByIdCategory: RequestWithContext<number, WorklistDto[]> = async (
	id: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<WorklistDto[]> => {
	const res = await fetch(apiUrl + `/task-category/${encodeURIComponent(id)}/worklists`)
	handleNonOk(res)
	const json = await res.json()

	return json
}

export const getWorklistsByIdCourse: RequestWithContext<number, WorklistDto[]> = async (
	id: number,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<WorklistDto[]> => {
	const res = await fetch(apiUrl + `/course/${encodeURIComponent(id)}/worklists`)
	handleNonOk(res)
	const json = await res.json()

	return json
}
