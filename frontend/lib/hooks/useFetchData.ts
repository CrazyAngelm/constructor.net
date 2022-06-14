import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { makeFetcher } from '../fetchers'
import { ApiError, RequestWithContext } from '../requests'

export interface Response<T> {
	data?: T
	error?: string
	update: () => void
	setData: Dispatch<SetStateAction<T | undefined>>
}

export const useFetchData = <T, R>(key: R,
	req: RequestWithContext<R, T>, setDefault?: T)
	: Response<T> => {
	const [ data, setData ] = useState<T | undefined>(setDefault)
	const [ error, setError ] = useState<string | undefined>(undefined)

	useEffect(() => {
		if (!setDefault)
			update()
	}, [ key ])

	const update = () => {
		setError(() => undefined)
		makeFetcher(req)(key).then(p => {
			setData(() => p)
		}).catch(err => {
			if (setDefault) {
				setData(() => setDefault)
				return
			}
			if (err instanceof ApiError) {
				console.error(`ApiError: method: ${req.name}, msg: ${err.message}`)
				setError(() => err.message)
			}
			else {
				console.error(`OtherError: method: ${req.name}, err: ${err}`)
				setError(JSON.stringify(err))
			}
		})
	}

	return {
		data,
		update,
		setData,
		error
	}
}
