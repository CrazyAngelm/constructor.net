export const VersionType = {
	unsupported: 'unsupported',
	alpha: 'alpha',
	beta: 'beta',
	stable: 'stable',
	lts: 'lts',

	getList: (): string[] => {
		return [
			VersionType.alpha,
			VersionType.beta,
			VersionType.lts,
			VersionType.stable,
			VersionType.unsupported,
		]
	},
}

export interface Version {
	id: string
	name: string
	type: string
	notes: string
	archive: string
}
