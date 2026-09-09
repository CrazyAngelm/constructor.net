import type {
	StudioImageAlignment,
	StudioItemKind,
	StudioPageFormat,
	StudioPageSettings,
	StudioSheet,
	StudioSheetItem,
	StudioTask,
} from './types'

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
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const parseLegacyTask = (value: unknown): ValidationResult<StudioTask> => {
	if (!isObject(value) || !Number.isSafeInteger(value.id) || (value.id as number) < 1
		|| typeof value.name !== 'string' || value.name.trim().length === 0
		|| typeof value.description !== 'string' || typeof value.instruction !== 'string'
		|| !(value.image === null || typeof value.image === 'string')
		|| !(value.complexity === null || (Number.isSafeInteger(value.complexity) && (value.complexity as number) > 0))) {
		return { error: 'Задание в листе заполнено некорректно' }
	}
	return { value: {
		id: value.id as number, name: value.name.trim(), description: value.description,
		instruction: value.instruction, complexity: value.complexity as number | null, image: value.image,
	} }
}

const pageSizes: Record<StudioPageFormat, { width: number; height: number }> = {
	A5: { width: 148, height: 210 }, A4: { width: 210, height: 297 }, A3: { width: 297, height: 420 },
}

const parseSettings = (value: unknown): ValidationResult<StudioPageSettings> => {
	if (!isObject(value) || ![ 'A5', 'A4', 'A3' ].includes(String(value.format)) || !isObject(value.margins)
		|| typeof value.footer !== 'string' || typeof value.showPageNumbers !== 'boolean'
		|| typeof value.showItemNumbers !== 'boolean' || !isFiniteNumber(value.fontSizePt) || value.fontSizePt <= 0
		|| !isFiniteNumber(value.itemGapMm) || value.itemGapMm < 0) {
		return { error: 'Настройки листа заполнены некорректно' }
	}
	const margins = value.margins
	const marginValues = [ margins.top, margins.right, margins.bottom, margins.left ]
	if (!marginValues.every(margin => isFiniteNumber(margin) && margin >= 0)) {
		return { error: 'Поля листа заполнены некорректно' }
	}
	const format = value.format as StudioPageFormat
	const size = pageSizes[format]
	if ((margins.left as number) + (margins.right as number) >= size.width
		|| (margins.top as number) + (margins.bottom as number) >= size.height) {
		return { error: 'Поля не оставляют места для содержимого листа' }
	}
	return { value: {
		format,
		margins: {
			top: margins.top as number, right: margins.right as number,
			bottom: margins.bottom as number, left: margins.left as number,
		},
		footer: value.footer,
		showPageNumbers: value.showPageNumbers,
		showItemNumbers: value.showItemNumbers,
		fontSizePt: value.fontSizePt,
		itemGapMm: value.itemGapMm,
	} }
}

const itemKinds: StudioItemKind[] = [ 'task', 'image', 'text', 'spacer' ]
const imageAlignments: StudioImageAlignment[] = [ 'left', 'center', 'right' ]

const parseItem = (value: unknown): ValidationResult<StudioSheetItem> => {
	if (!isObject(value) || typeof value.instanceId !== 'string' || value.instanceId.length === 0
		|| !itemKinds.includes(value.kind as StudioItemKind)
		|| !(value.sourceTaskId === null || (Number.isSafeInteger(value.sourceTaskId) && (value.sourceTaskId as number) > 0))
		|| typeof value.name !== 'string' || (value.kind !== 'spacer' && value.name.trim().length === 0)
		|| typeof value.description !== 'string' || typeof value.instruction !== 'string'
		|| !(value.complexity === null || (Number.isSafeInteger(value.complexity) && (value.complexity as number) > 0))
		|| !(value.image === null || typeof value.image === 'string')
		|| typeof value.showDescription !== 'boolean' || typeof value.showInstruction !== 'boolean'
		|| !isFiniteNumber(value.imageWidthPercent) || value.imageWidthPercent <= 0 || value.imageWidthPercent > 100
		|| !imageAlignments.includes(value.imageAlignment as StudioImageAlignment)
		|| !isFiniteNumber(value.spacerHeightMm) || value.spacerHeightMm < 0) {
		return { error: 'Элемент листа заполнен некорректно' }
	}
	if (value.kind === 'image' && !value.image) return { error: 'Для пользовательского изображения требуется файл' }
	if (value.kind === 'spacer' && value.spacerHeightMm === 0) return { error: 'Высота свободного места должна быть больше нуля' }
	return { value: {
		instanceId: value.instanceId,
		sourceTaskId: value.sourceTaskId as number | null,
		kind: value.kind as StudioItemKind,
		name: value.name.trim(),
		description: value.description,
		instruction: value.instruction,
		complexity: value.complexity as number | null,
		image: value.image,
		showDescription: value.showDescription,
		showInstruction: value.showInstruction,
		imageWidthPercent: value.imageWidthPercent,
		imageAlignment: value.imageAlignment as StudioImageAlignment,
		spacerHeightMm: value.spacerHeightMm,
	} }
}

const parseSheet = (value: unknown): ValidationResult<StudioSheet> => {
	if (!isObject(value) || !isObject(value.data) || !Array.isArray(value.data.items)) {
		return { error: 'Лист заполнен некорректно' }
	}
	if (value.version === 1) {
		const items: StudioTask[] = []
		for (const item of value.data.items) {
			const parsed = parseLegacyTask(item)
			if ('error' in parsed) return parsed
			items.push(parsed.value)
		}
		if (new Set(items.map(item => item.id)).size !== items.length) {
			return { error: 'Одно задание не должно повторяться в старом формате листа' }
		}
		return { value: { version: 1, data: { items } } }
	}
	if (value.version === 2) {
		const settings = parseSettings(value.data.settings)
		if ('error' in settings) return settings
		const items: StudioSheetItem[] = []
		for (const item of value.data.items) {
			const parsed = parseItem(item)
			if ('error' in parsed) return parsed
			items.push(parsed.value)
		}
		if (new Set(items.map(item => item.instanceId)).size !== items.length) {
			return { error: 'Экземпляры элементов листа не должны повторяться' }
		}
		return { value: { version: 2, data: { items, settings: settings.value } } }
	}
	return { error: 'Версия листа не поддерживается' }
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
	return { value: {
		name: name.value,
		teacherSheet: teacherSheet.value,
		studentSheet: studentSheet.value,
		...(typeof courseId.value === 'number' ? { courseId: courseId.value } : {}),
		...(typeof folderId.value === 'string' ? { folderId: folderId.value } : {}),
	} }
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
	return { value: {
		...(name.value === undefined ? {} : { name: name.value }),
		...(teacherSheet.value === undefined ? {} : { teacherSheet: teacherSheet.value }),
		...(studentSheet.value === undefined ? {} : { studentSheet: studentSheet.value }),
		...(courseId.value === undefined ? {} : { courseId: courseId.value }),
		...(folderId.value === undefined ? {} : { folderId: folderId.value }),
	} }
}

export const parseWorklistOrder = (body: unknown): ValidationResult<string[]> => {
	if (!isObject(body) || !Array.isArray(body.ids) || body.ids.some(id => typeof id !== 'string' || id.length === 0)) {
		return { error: 'Ожидается массив идентификаторов' }
	}
	if (new Set(body.ids).size !== body.ids.length) return { error: 'Идентификаторы не должны повторяться' }
	return { value: body.ids as string[] }
}

export const parseVisibility = (body: unknown): ValidationResult<boolean> => {
	if (!isObject(body) || typeof body.visible !== 'boolean') return { error: 'visible должен быть boolean' }
	return { value: body.visible }
}
