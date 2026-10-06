import { defaultPageSettings, emptyStudioSheet, StudioFontFamily, StudioSheetItem, StudioSheetV3 } from './types'

interface LegacyText { Text?: string; FontFamily?: string; FontSize?: number; HorizontalAlignment?: number }
interface LegacyObject {
	$type?: string
	Items?: LegacyObject[] | { $values?: LegacyObject[] }
	Item?: LegacyObject
	WorklistAdditional?: LegacyObject
	Setting?: { Format?: number; Padding?: string; Header?: LegacyText; IsNumerationPage?: boolean; NumerationConfig?: { Visible?: boolean }; FontFamily?: string; NormalFontSize?: number; Space?: number }
	Component?: LegacyText
	TextComponent?: LegacyText
	TaskDomain?: { Id?: number; Name?: string; Description?: string; Instruction?: string; Uri?: string; ImagePath?: string; ImageUrl?: string }
	ImageBase64?: string
	ImageHorizontalAlignment?: number
	Height?: number
	IsInstruction?: boolean
}
const font = (value?: string): StudioFontFamily => ['Arial', 'Times New Roman', 'Evolventa'].includes(value || '') ? value as StudioFontFamily : 'inherit'
const alignment = (value: number) => value === 0 ? 'left' as const : value === 2 ? 'right' as const : 'center' as const

const convertSheet = (source: LegacyObject): StudioSheetV3 => {
	const setting = source.Setting || {}
	const margins = typeof setting.Padding === 'string' ? setting.Padding.split(',').map(Number) : [12, 12, 12, 12]
	if (margins.length !== 4 || margins.some(value => !Number.isFinite(value) || value < 0)) throw new Error('Некорректные поля старого конспекта')
	const settings = { ...defaultPageSettings(), format: (['A5', 'A4', 'A3'] as const)[setting.Format ?? 1] || 'A4',
		margins: { left: margins[0]!, top: margins[1]!, right: margins[2]!, bottom: margins[3]! },
		footer: setting.Header?.Text || '', showPageNumbers: setting.IsNumerationPage ?? true,
		showItemNumbers: setting.NumerationConfig?.Visible ?? true, fontFamily: font(setting.FontFamily),
		// The desktop settings use millimetres; the web editor uses points.
		fontSizePt: setting.NormalFontSize ? setting.NormalFontSize * 72 / 25.4 : defaultPageSettings().fontSizePt, itemGapMm: setting.Space ?? defaultPageSettings().itemGapMm,
	}
	const sourceItems: LegacyObject[] = Array.isArray(source.Items) ? source.Items : source.Items?.$values || []
	const items: StudioSheetItem[] = []
	for (const [index, value] of sourceItems.entries()) {
		const type = String(value.$type || '').split(',')[0]?.split('.').pop() || ''
		if (type === 'WorklistAddItem') continue
		if (type === 'WorklistTempItem' && value.Item) { sourceItems.splice(index + 1, 0, value.Item); continue }
		const text = value.Component || value.TextComponent || {}
		const task = value.TaskDomain || {}
		const rawImage = value.ImageBase64 ? `data:image/png;base64,${value.ImageBase64}` : task.Uri || task.ImagePath || task.ImageUrl || null
		const image = typeof rawImage === 'string' ? rawImage.replace(/^https?:\/\/labstudio-inc\.ru(?::\d+)?(\/uploads\/)/, '$1') : null
		const kind = type === 'WorklistSpaceItem' ? 'spacer' : type === 'WorklistImageItem' ? 'image' : type?.includes('Task') ? 'task' : 'text'
		if (kind === 'image' && !image) throw new Error('В старом конспекте отсутствует изображение')
		if (!['WorklistTextBlockItem', 'WorklistHeaderItem', 'WorklistImageItem', 'WorklistSpaceItem', 'WorklistTaskItem', 'WorklistTextTaskItem'].includes(type!)) throw new Error(`Неизвестный элемент старого конспекта: ${type}`)
		items.push({ instanceId: `legacy-${index}`, sourceTaskId: task.Id && Number.isSafeInteger(task.Id) && task.Id > 0 ? task.Id : null,
			kind, name: task.Name || (kind === 'image' ? 'Изображение' : kind === 'spacer' ? '' : 'Текст'),
			description: task.Description || '', instruction: text.Text ?? task.Instruction ?? '', complexity: null, image,
			showDescription: false, showInstruction: kind === 'task' && type === 'WorklistTaskItem' ? Boolean(value.IsInstruction) : true,
			imageWidthPercent: 100, imageAlignment: alignment(value.ImageHorizontalAlignment ?? 1),
			spacerHeightMm: kind === 'spacer' ? value.Height || 1 : 0,
			fontFamily: font(text.FontFamily || setting.FontFamily),
			...(text.FontSize ? { fontSizePt: text.FontSize * 72 / 25.4 } : {}), textAlignment: alignment(text.HorizontalAlignment ?? 0),
		})
	}
	return { version: 3, data: { items, settings } }
}

export const convertLegacyProgram = (json: string) => {
	const source = JSON.parse(json) as LegacyObject
	return { teacherSheet: convertSheet(source), studentSheet: source.WorklistAdditional ? convertSheet(source.WorklistAdditional) : emptyStudioSheet() }
}
