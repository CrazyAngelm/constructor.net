import { Dispatch, SetStateAction } from 'react'

export const changeHanderDtoString = <T>(field: keyof T, setter: Dispatch<SetStateAction<T | undefined>>)
	: ((value: string) => void) => {
	return v => {
		setter(data => {
			if (!data) return data
			const obj: any = data
			obj[ field ] = v
			return { ...obj }
		})
	}
}
