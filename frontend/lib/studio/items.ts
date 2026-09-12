import type { StudioSheetItem } from './types'

export const updateSheetItem = (items: StudioSheetItem[], id: string, patch: Partial<StudioSheetItem>) => items.map(item =>
	item.instanceId === id ? { ...item, ...patch } : item.companion?.instanceId === id ? { ...item, companion: { ...item.companion, ...patch } } : item)

export const pairSheetItems = (items: StudioSheetItem[], id: string) => {
	const index = items.findIndex(item => item.instanceId === id)
	const first = items[index]
	const second = items[index + 1]
	if (!first || !second || first.companion || second.companion || first.kind === 'spacer' || second.kind === 'spacer') return items
	return [ ...items.slice(0, index), { ...first, companion: second }, ...items.slice(index + 2) ]
}

export const unpairSheetItems = (items: StudioSheetItem[], id: string) => items.flatMap(item => {
	if (item.instanceId !== id || !item.companion) return [ item ]
	const { companion, ...first } = item
	return [ first, companion ]
})

export const swapSheetPair = (items: StudioSheetItem[], id: string) => items.map(item => {
	if (item.instanceId !== id || !item.companion) return item
	const { companion, ...first } = item
	return { ...companion, companion: first }
})
