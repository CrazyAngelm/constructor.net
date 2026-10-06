import { describe, expect, it } from 'vitest'
import { convertLegacyProgram } from './legacyProgram'

describe('desktop program conversion', () => {
	it('preserves tasks, images, temporary wrapped tasks and the additional student sheet', () => {
		const text = { $type: 'labstudio.Model.WorklistModel.WorklistItems.WorklistTextBlockItem, Lab Studio', Component: { Text: 'Прочитай', FontSize: 7, FontFamily: 'Arial' } }
		const task = { $type: 'labstudio.Model.WorklistModel.WorklistTaskItem, Lab Studio', TaskDomain: { Id: 15, Name: 'Ритм', Uri: 'https://labstudio-inc.ru/uploads/task/15.png', Instruction: 'Хлопай' }, TextComponent: { Text: 'Хлопай дважды' }, IsInstruction: true }
		const wrapped = { $type: 'labstudio.Model.WorklistModel.WorklistTempItem, Lab Studio', Item: task }
		const result = convertLegacyProgram(JSON.stringify({ Setting: { Format: 1, Padding: '5,6,7,8', Header: { Text: 'Автор' } }, Items: { $values: [text, wrapped] }, WorklistAdditional: { Items: { $values: [{ $type: 'labstudio.Model.WorklistModel.WorklistItems.WorklistImageItem, Lab Studio', ImageBase64: 'aW1hZ2U=' }] } } }))
		expect(result.teacherSheet.data.items).toHaveLength(2)
		expect(result.teacherSheet.data.items[1]).toMatchObject({ name: 'Ритм', image: '/uploads/task/15.png', instruction: 'Хлопай дважды', sourceTaskId: 15 })
		expect(result.teacherSheet.data.settings.margins).toEqual({ left: 5, top: 6, right: 7, bottom: 8 })
		expect(result.studentSheet.data.items[0]?.image).toBe('data:image/png;base64,aW1hZ2U=')
	})
	it('refuses an unknown element rather than losing it silently', () => {
		expect(() => convertLegacyProgram(JSON.stringify({ Items: [{ $type: 'UnsupportedItem' }] }))).toThrow('Неизвестный элемент')
	})
})
