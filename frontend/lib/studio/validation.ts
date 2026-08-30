export interface StudioSheet {
	version: number
	data: {
		items: StudioTaskSnapshot[]
	}
}

export interface StudioTaskSnapshot {
	id: number
	name: string
	description: string
	instruction: string
	complexity: number | null
	image: string | null
}

export interface CreateStudioWorklistPayload {
	name: string
	teacherSheet: StudioSheet
	studentSheet: StudioSheet
	courseId?: number
	folderId?: string
}

export interface UpdateStudioWorklistPayload {
	name?: string
	teacherSheet?: StudioSheet
	studentSheet?: StudioSheet
	courseId?: number | null
	folderId?: string | null
}

export type ValidationResult<T> = { value: T } | { error: string }

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

const parseTask = (value: unknown): ValidationResult<StudioTaskSnapshot> => {
	if (!isObject(value) || !Number.isSafeInteger(value.id) || (value.id as number) < 1
		|| typeof value.name !== 'string' || value.name.trim().length === 0
		|| typeof value.description !== 'string' || typeof value.instruction !== 'string'
		|| !(value.image === null || typeof value.image === 'string')
		|| !(value.complexity === null || (Number.isSafeInteger(value.complexity) && (value.complexity as number) > 0))) {
		return { error: 'Задание в листе заполнено некорректно' }
	}
	return {
		value: {
			id: value.id as number,
			name: value.name.trim(),
			description: value.description,
			instruction: value.instruction,
			complexity: value.complexity as number | null,
			image: value.image,
		},
	}
}

const parseSheet = (value: unknown): ValidationResult<StudioSheet> => {
	if (!isObject(value) || typeof value.version !== 'number'
		|| value.version !== 1 || !isObject(value.data) || !Array.isArray(value.data.items)) {
		return { error: 'Лист должен соответствовать версии 1' }
	}
	const items: StudioTaskSnapshot[] = []
	for (const item of value.data.items) {
		const parsed = parseTask(item)
		if ('error' in parsed) return parsed
		items.push(parsed.value)
	}
	if (new Set(items.map((item) => item.id)).size !== items.length) {
		return { error: 'Одно задание не должно повторяться в одном листе' }
	}
	return { value: { version: 1, data: { items } } }
}

const parseName = (value: unknown): ValidationResult<string> => {
	if (typeof value !== 'string' || value.trim().length === 0) return { error: 'Название обязательно' }
	return { value: value.trim() }
}

const parseCourseId = (value: unknown, nullable: boolean): ValidationResult<number | null | undefined> => {
	if (value === undefined) return { value: undefined }
	if (nullable && value === null) return { value: null }
	if (!Number.isSafeInteger(value) || (value as number) < 1) return { error: 'Некорректный курс' }
	return { value: value as number }
}

const parseFolderId = (value: unknown, nullable: boolean): ValidationResult<string | null | undefined> => {
	if (value === undefined) return { value: undefined }
	if (nullable && value === null) return { value: null }
	if (typeof value !== 'string' || value.length === 0) return { error: 'Некорректная папка' }
	return { value }
}

export const parseCreateStudioWorklist = (body: unknown): ValidationResult<CreateStudioWorklistPayload> => {
	if (!isObject(body)) return { error: 'Ожидается JSON-объект' }
	const name = parseName(body.name)
	const teacherSheet = parseSheet(body.teacherSheet)
	const studentSheet = parseSheet(body.studentSheet)
	const courseId = parseCourseId(body.courseId, false)
	const folderId = parseFolderId(body.folderId, false)
	if ('error' in name) return name
	if ('error' in teacherSheet) return teacherSheet
	if ('error' in studentSheet) return studentSheet
	if ('error' in courseId) return courseId
	if ('error' in folderId) return folderId
	return {
		value: {
			name: name.value,
			teacherSheet: teacherSheet.value,
			studentSheet: studentSheet.value,
			...(typeof courseId.value === 'number' ? { courseId: courseId.value } : {}),
			...(typeof folderId.value === 'string' ? { folderId: folderId.value } : {}),
		},
	}
}

export const parseUpdateStudioWorklist = (body: unknown): ValidationResult<UpdateStudioWorklistPayload> => {
	if (!isObject(body)) return { error: 'Ожидается JSON-объект' }
	const name = body.name === undefined ? { value: undefined } : parseName(body.name)
	const teacherSheet = body.teacherSheet === undefined ? { value: undefined } : parseSheet(body.teacherSheet)
	const studentSheet = body.studentSheet === undefined ? { value: undefined } : parseSheet(body.studentSheet)
	const courseId = parseCourseId(body.courseId, true)
	const folderId = parseFolderId(body.folderId, true)
	if ('error' in name) return name
	if ('error' in teacherSheet) return teacherSheet
	if ('error' in studentSheet) return studentSheet
	if ('error' in courseId) return courseId
	if ('error' in folderId) return folderId
	if (name.value === undefined && teacherSheet.value === undefined && studentSheet.value === undefined
		&& courseId.value === undefined && folderId.value === undefined) return { error: 'Нет данных для изменения' }
	return {
		value: {
			...(name.value === undefined ? {} : { name: name.value }),
			...(teacherSheet.value === undefined ? {} : { teacherSheet: teacherSheet.value }),
			...(studentSheet.value === undefined ? {} : { studentSheet: studentSheet.value }),
			...(courseId.value === undefined ? {} : { courseId: courseId.value }),
			...(folderId.value === undefined ? {} : { folderId: folderId.value }),
		},
	}
}

export const parseWorklistOrder = (body: unknown): ValidationResult<string[]> => {
	if (!isObject(body) || !Array.isArray(body.ids) || body.ids.some((id) => typeof id !== 'string' || id.length === 0)) {
		return { error: 'Ожидается массив идентификаторов' }
	}
	if (new Set(body.ids).size !== body.ids.length) return { error: 'Идентификаторы не должны повторяться' }
	return { value: body.ids as string[] }
}

export const parseVisibility = (body: unknown): ValidationResult<boolean> => {
	if (!isObject(body) || typeof body.visible !== 'boolean') return { error: 'visible должен быть boolean' }
	return { value: body.visible }
}
