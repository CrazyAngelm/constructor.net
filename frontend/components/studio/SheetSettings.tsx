import type { StudioPageSettings, StudioPageFormat } from '@/lib/studio/types'
import styles from '@/styles/studio.module.scss'

const formats: StudioPageFormat[] = [ 'A5', 'A4', 'A3' ]

export default function SheetSettings({ settings, onChange, onCopy }: {
	settings: StudioPageSettings
	onChange: (settings: StudioPageSettings) => void
	onCopy: () => void
}) {
	const number = (value: string) => Number.isFinite(Number(value)) ? Number(value) : 0
	const margin = (side: keyof StudioPageSettings['margins'], value: string) => onChange({
		...settings,
		margins: { ...settings.margins, [side]: number(value) },
	})
	return <details className={styles.settingsPanel}>
		<summary>Настройки листа</summary>
		<div className={styles.settingsGrid}>
			<label>Формат<select aria-label="Формат" value={settings.format} onChange={event => onChange({ ...settings, format: event.target.value as StudioPageFormat })}>{formats.map(format => <option key={format}>{format}</option>)}</select></label>
			<label>Размер текста, пт<input type="number" min="1" step="0.5" value={settings.fontSizePt} onChange={event => onChange({ ...settings, fontSizePt: number(event.target.value) })} /></label>
			<fieldset><legend>Поля, мм</legend><div className={styles.marginGrid}>
				<label>Сверху<input type="number" min="0" value={settings.margins.top} onChange={event => margin('top', event.target.value)} /></label>
				<label>Справа<input type="number" min="0" value={settings.margins.right} onChange={event => margin('right', event.target.value)} /></label>
				<label>Снизу<input type="number" min="0" value={settings.margins.bottom} onChange={event => margin('bottom', event.target.value)} /></label>
				<label>Слева<input type="number" min="0" value={settings.margins.left} onChange={event => margin('left', event.target.value)} /></label>
			</div></fieldset>
			<label>Интервал между заданиями, мм<input type="number" min="0" step="0.5" value={settings.itemGapMm} onChange={event => onChange({ ...settings, itemGapMm: number(event.target.value) })} /></label>
			<label className={styles.wideField}>Подпись внизу листа<input value={settings.footer} onChange={event => onChange({ ...settings, footer: event.target.value })} placeholder="Например: для Анны" /><small>Можно указать, для какого ребёнка подготовлен материал.</small></label>
			<label className={styles.checkField}><input type="checkbox" checked={settings.showItemNumbers} onChange={event => onChange({ ...settings, showItemNumbers: event.target.checked })} /> Нумеровать задания</label>
			<label className={styles.checkField}><input type="checkbox" checked={settings.showPageNumbers} onChange={event => onChange({ ...settings, showPageNumbers: event.target.checked })} /> Нумеровать страницы</label>
			<button type="button" className={styles.secondary} onClick={onCopy}>Применить эти настройки к другому листу</button>
		</div>
	</details>
}
