import { ChangeEvent, Dispatch, EventHandler, SetStateAction } from 'react'

export const changeHanderDtoString = <T>(field: keyof T, setter: Dispatch<SetStateAction<T | undefined>>)
	: ((value: string) => void) => {
	return (v) => {
		setter((data) => {
			if (!data) data = {} as T
			const obj: any = data
			obj[field] = v
			return { ...obj }
		})
	}
}

export const changeHanderDtoNumber = <T>(field: keyof T, setter: Dispatch<SetStateAction<T | undefined>>)
	: ((value: number) => void) => {
	return (v) => {
		setter((data) => {
			if (!data) data = {} as T
			const obj: any = data
			obj[field] = v
			return { ...obj }
		})
	}
}

export const onChangeDto = <T>(field: keyof T, setter: Dispatch<SetStateAction<T | undefined>>)
	: ((ev: ChangeEvent<HTMLInputElement>) => void) => {
	return (ev) => {
		changeHanderDtoString(field, setter)(ev.target.value)
	}
}
