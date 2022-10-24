export interface Manual {
	id: number,
	name?: string,
	html?: string
}

export interface CreateManual {
	parentId?: number
}
