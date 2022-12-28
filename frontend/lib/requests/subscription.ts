import { LicenseDto, SubscribeReq, SubscribeRes, Subscription, SubscriptionReq } from '../dto/subscription'
import { RequestWithContext, RequestContext, defaultRequestContext, handleNonOk } from './shared'

export const getSubscription: RequestWithContext<SubscriptionReq, Subscription[]> = async (
	dto: SubscriptionReq,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<Subscription[]> => {
	const res = await fetch(apiUrl + '/subscription', {
		method: 'POST',
		body: JSON.stringify(dto)
	})
	handleNonOk(res)
	const json = await res.json()

	return json
}

export const getLicenses: RequestWithContext<unknown, LicenseDto[]> = async (
	_?: unknown,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<LicenseDto[]> => {
	const res = await fetch(apiUrl + '/subscription/license')
	handleNonOk(res)
	const json = await res.json()

	return json
}

export const subscribe: RequestWithContext<SubscribeReq, SubscribeRes> = async (
	dto: SubscribeReq,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<SubscribeRes> => {
	const res = await fetch(apiUrl + '/subscription/subscribe', {
		method: "POST",
		body: JSON.stringify(dto)
	})
	handleNonOk(res)
	const json = await res.json()

	return json
}
