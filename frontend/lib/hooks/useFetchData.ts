import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { UserDto } from '../dto/users'
import { makeFetcher } from '../fetchers'
import { ApiError, RequestWithContext } from '../requests'
import { getUserById } from '../requests/users'

export interface Response<T> {
	data?: T
	error?: string
	update: () => void
	setData: Dispatch<SetStateAction<T | undefined>>
}

export const useFetchData = <T, R>(key: R,
	req: RequestWithContext<R, T>)
	: Response<T> => {
	const [ data, setData ] = useState<T>()
	const [ error, setError ] = useState<string | undefined>(undefined)

	useEffect(() => update, [])

	const update = () => {
		setError(() => undefined)
		makeFetcher(req)(key).then(p => setData(() => p))
			.catch(err => {
				console.log(err)
				if (err instanceof ApiError) setError(() => err.message)
				else setError(JSON.stringify(err))
			})
	}

	return {
		data,
		update,
		setData,
		error
	}
}
