/* eslint-disable @next/next/no-img-element -- print layout measures authenticated source images */
import { CSSProperties, PointerEvent, useLayoutEffect, useRef, useState } from 'react'
import { paginateByMeasuredHeight } from '@/lib/studio/pagination'
import { studioFontCss } from '@/lib/studio/types'
import type { StudioPageFormat, StudioPageSettings, StudioSheetItem, StudioSheetV3 } from '@/lib/studio/types'
import styles from '@/styles/studio.module.scss'

const pageSizes: Record<StudioPageFormat, { width: number; height: number }> = {
	A5: { width: 148, height: 210 }, A4: { width: 210, height: 297 }, A3: { width: 297, height: 420 },
}
type Resize = (id: string, width: number) => void
const clampWidth = (width: number) => Math.min(100, Math.max(1, Math.round(width)))

function SheetImage({ item, onResize }: { item: StudioSheetItem; onResize?: Resize }) {
	const frame = useRef<HTMLDivElement>(null)
	const [ ratio, setRatio ] = useState<number>()
	const [ draggingWidth, setDraggingWidth ] = useState<number>()
	const drag = useRef<{ x: number; width: number; columnWidth: number; result: number }>()
	const start = (event: PointerEvent<HTMLButtonElement>) => {
		const node = frame.current
		if (!node || !node.parentElement) return
		event.preventDefault()
		event.currentTarget.setPointerCapture(event.pointerId)
		const columnWidth = node.parentElement.getBoundingClientRect().width
		const width = node.getBoundingClientRect().width / columnWidth * 100
		drag.current = { x: event.clientX, width, columnWidth, result: width }
	}
	const move = (event: PointerEvent<HTMLButtonElement>) => {
		if (!drag.current) return
		const value = clampWidth(drag.current.width + (event.clientX - drag.current.x) / drag.current.columnWidth * 100)
		drag.current.result = value
		setDraggingWidth(value)
	}
	const finish = () => {
		if (!drag.current) return
		onResize?.(item.instanceId, clampWidth(drag.current.result))
		drag.current = undefined
		setDraggingWidth(undefined)
	}
	return <div ref={frame} className={styles.sheetImage} style={{
		width: `${draggingWidth ?? item.imageWidthPercent}%`,
		// Keep the existing maximum image height, but constrain width proportionally too.
		maxWidth: ratio ? `calc(var(--image-max-height) * ${ratio})` : undefined,
		marginLeft: item.imageAlignment === 'left' ? 0 : 'auto',
		marginRight: item.imageAlignment === 'right' ? 0 : 'auto',
	}}>
		<img src={item.image!} alt={item.name} onLoad={event => setRatio(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight)} />
		{onResize && <button type="button" className={styles.imageResize} aria-label={`Изменить размер изображения «${item.name}»`} title="Потяните вправо или влево. Клавиши ← и → тоже меняют размер."
			onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={() => { drag.current = undefined; setDraggingWidth(undefined) }}
			onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); onResize(item.instanceId, clampWidth(item.imageWidthPercent + (event.key === 'ArrowRight' ? 1 : -1))) } }}><span aria-hidden="true">↔</span></button>}
	</div>
}

function Column({ item, settings, number, onResize }: { item: StudioSheetItem; settings: StudioPageSettings; number: string; onResize?: Resize }) {
	return <div className={styles.sheetColumn} data-column-id={item.instanceId} style={{ fontFamily: item.fontFamily ? studioFontCss(item.fontFamily) : undefined, fontSize: item.fontSizePt ? `${item.fontSizePt}pt` : undefined, textAlign: item.textAlignment }}>
		<header>{settings.showItemNumbers && <span>{number}.</span>}<h3>{item.name}</h3></header>
		{item.image && <SheetImage item={item} onResize={onResize} />}
		{item.showDescription && item.description && <p>{item.description}</p>}
		{item.showInstruction && item.instruction && <p>{item.instruction}</p>}
		{item.complexity && <small>Сложность: {item.complexity}</small>}
	</div>
}

function ItemContent({ item, settings, number, onResize }: { item: StudioSheetItem; settings: StudioPageSettings; number: number; onResize?: Resize }) {
	if (item.kind === 'spacer') return <div className={styles.sheetSpacer} data-sheet-item={item.instanceId} style={{ height: `${item.spacerHeightMm}mm` }} aria-label={`Свободное место ${item.spacerHeightMm} мм`} />
	return <article className={`${styles.sheetTask} ${item.companion ? styles.sheetPair : ''}`} data-sheet-item={item.instanceId}>
		<Column item={item} settings={settings} number={String(number)} onResize={onResize} />
		{item.companion && <Column item={item.companion} settings={settings} number={`${number}б`} onResize={onResize} />}
	</article>
}

const variablesFor = (settings: StudioPageSettings): CSSProperties => {
	const size = pageSizes[settings.format]
	// Same image-height ceiling as previously saved sheets; no automatic text shrinking.
	const imageMaxHeight = Math.max(20, (size.height - settings.margins.top - settings.margins.bottom - 45) * .62)
	return {
		'--page-width': `${size.width}mm`, '--page-height': `${size.height}mm`,
		'--margin-top': `${settings.margins.top}mm`, '--margin-right': `${settings.margins.right}mm`,
		'--margin-bottom': `${settings.margins.bottom}mm`, '--margin-left': `${settings.margins.left}mm`,
		'--measure-width': `${Math.max(1, size.width - settings.margins.left - settings.margins.right)}mm`,
		'--item-gap': `${settings.itemGapMm}mm`, '--sheet-font-size': `${settings.fontSizePt}pt`,
		'--sheet-font-family': studioFontCss(settings.fontFamily),
		'--heading-size': settings.headingSizePt ? `${settings.headingSizePt}pt` : '1.7em',
		'--footer-size': settings.footerSizePt ? `${settings.footerSizePt}pt` : '.8em',
		'--footer-font': settings.footerFontFamily ? studioFontCss(settings.footerFontFamily) : 'inherit',
		'--image-max-height': `${imageMaxHeight}mm`,
	} as CSSProperties
}

function Page({ items, allItems, settings, title, pageNumber, pageCount, measure = false, onResize }: {
	items: StudioSheetItem[]; allItems: StudioSheetItem[]; settings: StudioPageSettings; title: string
	pageNumber: number; pageCount: number; measure?: boolean; onResize?: Resize
}) {
	return <article className={`${styles.previewPage} ${measure ? styles.measurePage : ''}`} style={variablesFor(settings)} aria-label={measure ? undefined : `Страница ${pageNumber} из ${pageCount}`}>
		<header className={styles.pageHeader}><small>LabStudio</small><h2>{title || 'Без названия'}</h2></header>
		<div className={styles.pageBody} data-page-capacity={measure ? 'true' : undefined}>
			{items.map(item => <ItemContent key={item.instanceId} item={item} settings={settings} number={allItems.findIndex(value => value.instanceId === item.instanceId) + 1} onResize={onResize} />)}
		</div>
		<footer className={styles.pageFooter}><span>{settings.footer}</span>{settings.showPageNumbers && <span>{pageNumber} / {pageCount}</span>}</footer>
	</article>
}

export default function SheetPreview({ sheet, title, label, onResize, onPrintable }: {
	sheet: StudioSheetV3; title: string; label: string; onResize?: Resize; onPrintable?: (ready: boolean) => void
}) {
	const measureRef = useRef<HTMLDivElement>(null)
	const [ pages, setPages ] = useState<StudioSheetItem[][]>([ sheet.data.items ])
	const [ oversized, setOversized ] = useState<string[]>([])
	const [ failedImages, setFailedImages ] = useState(false)
	const [ ready, setReady ] = useState(false)
	const settings = sheet.data.settings

	useLayoutEffect(() => {
		let cancelled = false
		const root = measureRef.current
		if (!root) return
		setReady(false)
		onPrintable?.(false)
		const measure = async () => {
			await document.fonts.ready
			const images = [ ...root.querySelectorAll('img') ]
			await Promise.all(images.map(image => image.decode().catch(() => undefined)))
			await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
			if (cancelled) return
			const capacityNode = root.querySelector<HTMLElement>('[data-page-capacity="true"]')
			// Print CSS hides the measuring tree. Its ResizeObserver then reports zero
			// sizes: keep the already calculated physical pages instead of repaginating zeros.
			if (!capacityNode || !capacityNode.getClientRects().length) return
			const bodyStyle = getComputedStyle(capacityNode)
			const capacity = capacityNode.clientHeight - parseFloat(bodyStyle.paddingTop) - parseFloat(bodyStyle.paddingBottom)
			const heights = new Map([ ...root.querySelectorAll<HTMLElement>('[data-measure-item]') ].map(node => [ node.dataset.measureItem || '', node.getBoundingClientRect().height ]))
			const result = paginateByMeasuredHeight(sheet.data.items, heights, capacity, settings.itemGapMm * 96 / 25.4)
			const failed = images.some(image => !image.naturalWidth)
			setPages(result.pages)
			setOversized(result.oversized)
			setFailedImages(failed)
			setReady(true)
			onPrintable?.(!failed && result.oversized.length === 0)
		}
		const observer = new ResizeObserver(() => { void measure() })
		root.querySelectorAll('[data-measure-item], [data-page-capacity]').forEach(node => observer.observe(node))
		void measure()
		return () => { cancelled = true; observer.disconnect() }
	}, [ sheet.data.items, settings, title, onPrintable ])

	return <>
		<style>{`@page { size: ${settings.format}; margin: 0; }`}</style>
		<section className={styles.sheet} aria-label="Предпросмотр листа" data-pagination-ready={ready ? 'true' : 'false'}>
			<div className={styles.sheetHead}><div><span className={styles.eyebrow}>Предпросмотр страниц</span><h2>{label}</h2><p>{pages.length} {pages.length === 1 ? 'страница' : pages.length < 5 ? 'страницы' : 'страниц'}</p><p>Размер картинки можно менять за маркер ↔ в её нижнем углу. После отпускания листы пересчитаются.</p></div></div>
			{oversized.length > 0 && <p className={styles.pageWarning} role="alert">Одно из упражнений выше печатной области. Уменьшите изображение или текст перед печатью.</p>}
			{failedImages && <p className={styles.pageWarning} role="alert">Не все изображения загрузились. Проверьте соединение или замените недоступное изображение перед печатью.</p>}
			<div className={styles.previewPages}>{pages.map((items, index) => <Page key={index} items={items} allItems={sheet.data.items} settings={settings} title={title} pageNumber={index + 1} pageCount={pages.length} onResize={onResize} />)}</div>
		</section>
		<div className={styles.measureRoot} ref={measureRef} aria-hidden="true">
			<Page items={[]} allItems={sheet.data.items} settings={settings} title={title} pageNumber={1} pageCount={1} measure />
			<div className={styles.measureItems} style={variablesFor(settings)}>{sheet.data.items.map((item, index) => <div key={item.instanceId} data-measure-item={item.instanceId}><ItemContent item={item} settings={settings} number={index + 1} /></div>)}</div>
		</div>
	</>
}
