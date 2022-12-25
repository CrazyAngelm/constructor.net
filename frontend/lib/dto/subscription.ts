export interface LicenseDto {
	id?: number,
	name?: string,
	description?: string,
	price?: number,
	duration?: number
}

export interface Subscription {
	id?: string,
	userId?: string,
	licenseId?: number,
	startDate?: Date,
	endDate?: Date,
	lastPayment?: Date,
	active?: boolean
}
