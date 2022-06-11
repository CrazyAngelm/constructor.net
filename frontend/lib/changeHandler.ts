import { Dispatch, SetStateAction } from 'react'

export const changeHanderDtoString = <T, V>(field: keyof T, setter: Dispatch<SetStateAction<T | undefined>>)
	: ((value: string | boolean | number) => void) => {
	return v => {

		setter(data => {
			if (!data) return data
			const obj: any = data
			if (typeof obj[ field ] !== (typeof v)) throw Error('Типы не совпадают')
			obj[ field ] = v
			return { ...obj }
		})
	}
}
