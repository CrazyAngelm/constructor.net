import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { makeFetcher } from '../fetchers'
import { ApiError, RequestWithContext } from '../requests'

export interface Response<T> {
	data?: T
	error?: string
	update: () => void
	setData: Dispatch<SetStateAction<T | undefined>>
}

const compare = (key1:any, key2:any) : boolean => {
	return JSON.stringify(key1) === JSON.stringify(key2)
}

export const useFetchData = <T, R>(key: R,
	req: RequestWithContext<R, T>, setDefault?: T)
	: Response<T> => {
	const [ data, setData ] = useState<T | undefined>(setDefault)
	const [ error, setError ] = useState<string | undefined>(undefined)
	const [ lastKey, setLastKey ] = useState<R | undefined>(undefined)

	useEffect(() => {
		if(compare(lastKey, key)) return
		setLastKey(() => key)
		if (!setDefault)
			update()
		else setData(() => setDefault)
	}, [ key ])

	const update = () => {
		setError(() => undefined)
		makeFetcher(req)(key).then((p) => {
			setData(() => p)
		}).catch((err) => {
			if (setDefault) {
				setData(() => setDefault)
				return
			}
			if (err instanceof ApiError) {
				setError(() => err.message)
			} else {
				setError(JSON.stringify(err))
			}
		})
	}

	return {
		data,
		update,
		setData,
		error,
	}
}
