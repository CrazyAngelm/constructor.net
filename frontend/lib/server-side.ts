import { RequestContext, defaultRequestContext } from './requests/shared'

export const serverSideRequestContext = {
	apiUrl: process.env.SC_SERVER_SIDE_API_URL || defaultRequestContext.apiUrl,
}

export const makeSeverSide = <Key, Ret>(
	request: (key: Key, ctx: RequestContext) => Promise<Ret>,
): ((key: Key) => Promise<Ret>) => {
	return async (key: Key): Promise<Ret> => {
		return await request(key, serverSideRequestContext)
	}
}
