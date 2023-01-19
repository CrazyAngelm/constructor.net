export interface LicenseDto {
	id?: number,
	name?: string,
	description?: string,
	price?: number,
	duration?: number,
	freeCourses?: number
	courses?: string
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
	active?: boolean,
	paymentTitle?: string,
	courses?: string
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

export interface ChangePaymentMethodReq {
	userId?: string,
	subscriptionId?: string
}

export interface ChangePaymentMethodRes {
	confirmationToken: string
	returnUrl?: string
}

export interface ChangeCourseReq {
	userId?: string
	coursesId?: number[]
}
