import { LicenseDto } from '../dto/subscription'
import { RequestWithContext, RequestContext, defaultRequestContext, handleNonOk } from './shared'

export const getLicenses: RequestWithContext<unknown, LicenseDto[]> = async (
	_?: unknown,
	{ apiUrl }: RequestContext = defaultRequestContext,
): Promise<LicenseDto[]> => {
	const res = await fetch(apiUrl + '/subscription/license')
	handleNonOk(res)
	const json = await res.json()

	return json
}
