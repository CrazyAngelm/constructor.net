export interface LicenseDto {
	id?: number,
	name?: string,
	description?: string,
	price?: number,
	duration?: number,
	freeCourses?: number
	courses: Courses
}

export interface Courses {
	id: number
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

export interface SubscribeReq {
	userId?: string
	licenseId?: number
}

export interface SubscribeRes {
	licenseId: number
	confirmationToken: string
	returnUrl?: string
}

export interface SubscriptionReq {
	id?: string
}

export interface UnsubscribeReq {
	subscriptionId?: string,
	userId?: string
}

export interface UnsubscribeRes {

}
