/* eslint-disable @next/next/no-img-element -- print layout must measure the exact authenticated source image */
import { CSSProperties, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { paginateByMeasuredHeight } from '@/lib/studio/pagination'
import type { StudioPageFormat, StudioPageSettings, StudioSheetItem, StudioSheetV2 } from '@/lib/studio/types'
import styles from '@/styles/studio.module.scss'

const pageSizes: Record<StudioPageFormat, { width: number; height: number }> = {
	A5: { width: 148, height: 210 },
	A4: { width: 210, height: 297 },
	A3: { width: 297, height: 420 },
}

const ItemContent = ({ item, settings, number }: { item: StudioSheetItem; settings: StudioPageSettings; number: number }) => {
	if (item.kind === 'spacer') return <div className={styles.sheetSpacer} data-sheet-item={item.instanceId} style={{ height: `${item.spacerHeightMm}mm` }} aria-label={`Свободное место ${item.spacerHeightMm} мм`} />
	const imageStyle: CSSProperties = {
		width: `${item.imageWidthPercent}%`,
		marginLeft: item.imageAlignment === 'left' ? 0 : 'auto',
		marginRight: item.imageAlignment === 'right' ? 0 : 'auto',
	}
	return <article className={styles.sheetTask} data-sheet-item={item.instanceId}>
		<header>{settings.showItemNumbers && <span>{number}.</span>}<h3>{item.name}</h3></header>
		{item.image && <img src={item.image} alt={item.name} style={imageStyle} />}
		{item.showDescription && item.description && <p>{item.description}</p>}
		{item.showInstruction && item.instruction && <p>{item.instruction}</p>}
		{item.complexity && <small>Сложность: {item.complexity}</small>}
	</article>
}

const Page = ({ items, allItems, settings, title, pageNumber, pageCount, measure = false }: {
	items: StudioSheetItem[]
	allItems: StudioSheetItem[]
	settings: StudioPageSettings
	title: string
	pageNumber: number
	pageCount: number
	measure?: boolean
}) => {
	const size = pageSizes[settings.format]
	const imageMaxHeight = Math.max(20, (size.height - settings.margins.top - settings.margins.bottom - 45) * .62)
	const variables = {
		'--page-width': `${size.width}mm`,
		'--page-height': `${size.height}mm`,
		'--margin-top': `${settings.margins.top}mm`,
		'--margin-right': `${settings.margins.right}mm`,
		'--margin-bottom': `${settings.margins.bottom}mm`,
		'--margin-left': `${settings.margins.left}mm`,
		'--item-gap': `${settings.itemGapMm}mm`,
		'--sheet-font-size': `${settings.fontSizePt}pt`,
		'--image-max-height': `${imageMaxHeight}mm`,
	} as CSSProperties
	return <article className={`${styles.previewPage} ${measure ? styles.measurePage : ''}`} style={variables} aria-label={measure ? undefined : `Страница ${pageNumber} из ${pageCount}`}>
		<header className={styles.pageHeader}><small>LabStudio</small><h2>{title || 'Без названия'}</h2></header>
		<div className={styles.pageBody} data-page-capacity={measure ? 'true' : undefined}>
			{items.map(item => <ItemContent key={item.instanceId} item={item} settings={settings} number={allItems.findIndex(value => value.instanceId === item.instanceId) + 1} />)}
		</div>
		<footer className={styles.pageFooter}><span>{settings.footer}</span>{settings.showPageNumbers && <span>{pageNumber} / {pageCount}</span>}</footer>
	</article>
}

export default function SheetPreview({ sheet, title, label }: { sheet: StudioSheetV2; title: string; label: string }) {
	const measureRef = useRef<HTMLDivElement>(null)
	const [ pages, setPages ] = useState<StudioSheetItem[][]>([ sheet.data.items ])
	const [ oversized, setOversized ] = useState<string[]>([])
	const [ ready, setReady ] = useState(false)
	const settings = sheet.data.settings
	const size = pageSizes[settings.format]
	const measureWidth = Math.max(1, size.width - settings.margins.left - settings.margins.right)
	const imageMaxHeight = Math.max(20, (size.height - settings.margins.top - settings.margins.bottom - 45) * .62)
	const measurementStyle = useMemo(() => ({
		'--measure-width': `${measureWidth}mm`,
		'--item-gap': `${settings.itemGapMm}mm`,
		'--sheet-font-size': `${settings.fontSizePt}pt`,
		'--image-max-height': `${imageMaxHeight}mm`,
	} as CSSProperties), [ imageMaxHeight, measureWidth, settings.itemGapMm, settings.fontSizePt ])

	useLayoutEffect(() => {
		let cancelled = false
		setReady(false)
		const measure = async () => {
			await document.fonts.ready
			const root = measureRef.current
			if (!root) return
			await Promise.all([ ...root.querySelectorAll('img') ].map(image => image.decode().catch(() => undefined)))
			await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
			if (cancelled || !measureRef.current) return
			const capacityNode = root.querySelector<HTMLElement>('[data-page-capacity="true"]')
			const itemNodes = root.querySelectorAll<HTMLElement>('[data-measure-item]')
			if (!capacityNode) return
			const heights = new Map([ ...itemNodes ].map(node => [ node.dataset.measureItem || '', node.getBoundingClientRect().height ]))
			const gap = settings.itemGapMm * 96 / 25.4
			const result = paginateByMeasuredHeight(sheet.data.items, heights, capacityNode.clientHeight, gap)
			setPages(result.pages)
			setOversized(result.oversized)
			setReady(true)
		}
		void measure()
		return () => { cancelled = true }
	}, [ sheet.data.items, settings ])

	return <>
		<style>{`@page { size: ${settings.format}; margin: 0; }`}</style>
		<section className={styles.sheet} aria-label="Предпросмотр листа" data-pagination-ready={ready ? 'true' : 'false'}>
			<div className={styles.sheetHead}><div><span className={styles.eyebrow}>Предпросмотр страниц</span><h2>{label}</h2><p>{pages.length} {pages.length === 1 ? 'страница' : pages.length < 5 ? 'страницы' : 'страниц'}</p></div></div>
			{oversized.length > 0 && <p className={styles.pageWarning} role="alert">Одно из упражнений выше печатной области. Уменьшите изображение или текст перед печатью.</p>}
			<div className={styles.previewPages}>{pages.map((items, index) => <Page key={`${index}-${items.map(item => item.instanceId).join('-')}`} items={items} allItems={sheet.data.items} settings={settings} title={title} pageNumber={index + 1} pageCount={pages.length} />)}</div>
		</section>
		<div className={styles.measureRoot} ref={measureRef} aria-hidden="true">
			<Page items={[]} allItems={sheet.data.items} settings={settings} title={title} pageNumber={1} pageCount={1} measure />
			<div className={styles.measureItems} style={measurementStyle}>{sheet.data.items.map((item, index) => <div key={item.instanceId} data-measure-item={item.instanceId}><ItemContent item={item} settings={settings} number={index + 1} /></div>)}</div>
		</div>
	</>
}
