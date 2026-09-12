import { previewExternalFlowsRestricted } from '@/lib/preview'
import type { StudioSheet } from './types'

export const licenseCanEditFooter = (license: { id: number; name: string }) => {
	// Existing WPF rule: PropertiesWorklistVM.PremissionColontitul, licenses 3/4.
	if (license.id === 3 || license.id === 4) return true
	// The isolated synthetic demo license demonstrates the paid editor; never a production bypass.
	return previewExternalFlowsRestricted() && !!process.env.PREVIEW_LICENSE_NAME && license.name === process.env.PREVIEW_LICENSE_NAME
}

export const sheetFooter = (sheet?: StudioSheet) => sheet?.version === 2 || sheet?.version === 3 ? sheet.data.settings.footer : ''
