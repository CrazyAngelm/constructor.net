export const previewExternalFlowsRestricted = (): boolean => process.env.PREVIEW_DEPLOYMENT_MODE === 'isolated-preview'
	&& process.env.PREVIEW_RESTRICT_EXTERNAL_FLOWS === 'true'

export const previewExternalFlowError = { code: 503, message: 'Операция отключена в демонстрационной веб-версии' }
