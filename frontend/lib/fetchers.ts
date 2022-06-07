import {
	Request,
	RequestWithContext,
	defaultRequestContext,
	applyRequestContext,
} from './requests'

export const makeFetcher = <Key, Ret>(
	req: RequestWithContext<Key, Ret>,
): Request<Key, Ret> => {
	return applyRequestContext(defaultRequestContext, req)
}
