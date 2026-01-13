import { ChangeCourseReq, ChangePaymentMethodReq, ChangePaymentMethodRes, LicenseDto, SubscribeReq, SubscribeRes, Subscription, SubscriptionReq, UnsubscribeReq, UnsubscribeRes } from '../dto/subscription'
import { RequestWithContext, RequestContext, defaultRequestContext, handleNonOk } from './shared'

export const getSubscription: RequestWithContext<SubscriptionReq, Subscription[]> = async (
	dto: SubscriptionReq,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Subscription[]> => {
	const res = await fetch(apiUrl + '/subscription', {
		method: 'POST',
		body: JSON.stringify(dto),
	})
	await handleNonOk(res)
	const json = await res.json()

	return json
}

export const getLicenses: RequestWithContext<unknown, LicenseDto[]> = async (
	_?: unknown,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<LicenseDto[]> => {
	const res = await fetch(apiUrl + '/subscription/license')
	await handleNonOk(res)
	const json = await res.json()

	return json
}

export const subscribe: RequestWithContext<SubscribeReq, SubscribeRes> = async (
	dto: SubscribeReq,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<SubscribeRes> => {
	const res = await fetch(apiUrl + '/subscription/subscribe', {
		method: 'POST',
		body: JSON.stringify(dto),
	})
	await handleNonOk(res)
	const json = await res.json()

	return json
}

export const freeSubscribe: RequestWithContext<SubscribeReq, SubscribeRes> = async (
	dto: SubscribeReq,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<SubscribeRes> => {
	const res = await fetch(apiUrl + '/subscription/trial-subscribe', {
		method: 'POST',
		body: JSON.stringify(dto),
	})
	await handleNonOk(res)
	const json = await res.json()

	return json
}

export const unsubscribe: RequestWithContext<UnsubscribeReq, UnsubscribeRes> = async (
	dto: UnsubscribeReq,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<UnsubscribeRes> => {
	const res = await fetch(apiUrl + '/subscription/unsubscribe', {
		method: 'POST',
		body: JSON.stringify(dto),
	})
	await handleNonOk(res)
	const json = await res.json()

	return json
}

export const changePaymentMethod: RequestWithContext<ChangePaymentMethodReq, ChangePaymentMethodRes> = async (
	dto: ChangePaymentMethodReq,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<ChangePaymentMethodRes> => {
	const res = await fetch(apiUrl + '/subscription/change-payment-method', {
		method: 'POST',
		body: JSON.stringify(dto),
	})
	await handleNonOk(res)
	const json = await res.json()

	return json
}

export const resetPaymentMethod: RequestWithContext<ChangePaymentMethodReq, ChangePaymentMethodRes> = async (
	dto: ChangePaymentMethodReq,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<ChangePaymentMethodRes> => {
	const res = await fetch(apiUrl + '/subscription/reset-payment-method', {
		method: 'POST',
		body: JSON.stringify(dto),
	})
	await handleNonOk(res)
	const json = await res.json()

	return json
}

export const changeCourses: RequestWithContext<ChangeCourseReq, Record<string, unknown>> = async (
	dto: ChangeCourseReq,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Record<string, unknown>> => {
	const res = await fetch(apiUrl + '/subscription/change-course', {
		method: 'POST',
		body: JSON.stringify(dto),
	})
	await handleNonOk(res)
	const json = await res.json()

	return json
}
