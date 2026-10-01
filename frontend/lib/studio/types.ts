export type StudioPageFormat = 'A5' | 'A4' | 'A3'
export type StudioItemKind = 'task' | 'image' | 'text' | 'spacer'
export type StudioImageAlignment = 'left' | 'center' | 'right'
export type StudioImageLayout = 'original' | 'worksheet'
export type StudioFontFamily = 'inherit' | 'Arial' | 'Times New Roman' | 'Evolventa'
export const studioFontCss = (font?: StudioFontFamily) => {
	if (font === 'Arial') return 'Arial, sans-serif'
	if (font === 'Times New Roman') return '"Times New Roman", Times, serif'
	if (font === 'Evolventa') return 'Evolventa, sans-serif'
	return 'var(--font-ui)'
}

export interface StudioTask {
	id: number
	name: string
	description: string
	instruction: string
	complexity: number | null
	image: string | null
	imageLayout?: StudioImageLayout
}

export interface StudioCategory {
	id: number
	name: string
	description?: string
	tasks: StudioTask[]
	children: StudioCategory[]
}

export interface StudioCourse {
	id: number
	visible?: boolean
	name: string
	description?: string
	categoryTree: StudioCategory[]
}

export interface StudioPageSettings {
	format: StudioPageFormat
	margins: { top: number; right: number; bottom: number; left: number }
	footer: string
	showPageNumbers: boolean
	showItemNumbers: boolean
	fontSizePt: number
	itemGapMm: number
	fontFamily?: StudioFontFamily
	headingSizePt?: number
	footerFontFamily?: StudioFontFamily
	footerSizePt?: number
}

export interface StudioSheetItem {
	instanceId: string
	sourceTaskId: number | null
	kind: StudioItemKind
	name: string
	description: string
	instruction: string
	complexity: number | null
	image: string | null
	imageLayout?: StudioImageLayout
	showDescription: boolean
	showInstruction: boolean
	imageWidthPercent: number
	imageAlignment: StudioImageAlignment
	spacerHeightMm: number
	fontFamily?: StudioFontFamily
	fontSizePt?: number
	textAlignment?: StudioImageAlignment
	companion?: StudioSheetItem
}

export interface StudioSheetV1 {
	version: 1
	data: { items: StudioTask[] }
}

export interface StudioSheetV2 {
	version: 2
	data: { items: StudioSheetItem[]; settings: StudioPageSettings }
}

export interface StudioSheetV3 {
	version: 3
	data: { items: StudioSheetItem[]; settings: StudioPageSettings }
}

export type StudioSheet = StudioSheetV1 | StudioSheetV2 | StudioSheetV3

export interface StudioFolder { id: string; name: string }

export interface StudioWorklist {
	id: string
	name: string
	teacherSheet: StudioSheetV3
	studentSheet: StudioSheetV3
	personalFolderId?: string | null
	courseId?: number | null
	folderId?: string | null
	position?: number
	published?: boolean
	createdAt?: string
	updatedAt?: string
}

export interface StudioProgram {
	id: string
	name: string
	courseId: number
	courseName: string
	folderName?: string
}

export const defaultPageSettings = (): StudioPageSettings => ({
	format: 'A4',
	margins: { top: 12, right: 12, bottom: 12, left: 12 },
	footer: '',
	showPageNumbers: true,
	showItemNumbers: true,
	fontSizePt: 10,
	itemGapMm: 5,
})

export const emptyStudioSheet = (): StudioSheetV3 => ({
	version: 3,
	data: { items: [], settings: defaultPageSettings() },
})

export const catalogTaskToSheetItem = (task: StudioTask, instanceId: string): StudioSheetItem => ({
	instanceId,
	sourceTaskId: task.id,
	kind: 'task',
	name: task.name,
	description: task.description,
	instruction: task.instruction,
	complexity: task.complexity,
	image: task.image,
	...(task.imageLayout ? { imageLayout: task.imageLayout } : {}),
	showDescription: true,
	showInstruction: true,
	imageWidthPercent: 100,
	imageAlignment: 'center',
	spacerHeightMm: 0,
})

// These four source-catalog tasks predate the layout setting. Keep previously
// saved worksheets wide when opened again, without changing custom image items.
const legacyGuideTaskIds = new Set([ 106, 107, 108, 109 ])
const upgradeSheetItem = (item: StudioSheetItem): StudioSheetItem => ({
	...item,
	...(item.imageLayout || !item.sourceTaskId || !legacyGuideTaskIds.has(item.sourceTaskId)
		? {}
		: { imageLayout: 'worksheet' as const }),
	...(item.companion ? { companion: upgradeSheetItem(item.companion) } : {}),
})

export const upgradeStudioSheet = (sheet?: StudioSheet): StudioSheetV3 => {
	if ((sheet?.version === 2 || sheet?.version === 3) && Array.isArray(sheet.data?.items)) {
		return {
			version: 3,
			data: {
				items: sheet.data.items.map(upgradeSheetItem),
				settings: sheet.data.settings || defaultPageSettings(),
			},
		}
	}
	if (sheet?.version === 1 && Array.isArray(sheet.data?.items)) {
		return {
			version: 3,
			data: {
				items: sheet.data.items.map((task, index) => catalogTaskToSheetItem(task, `legacy-${task.id}-${index}`)),
				settings: defaultPageSettings(),
			},
		}
	}
	return emptyStudioSheet()
}
