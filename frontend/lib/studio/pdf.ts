import type { StudioPageFormat } from './types'

const pageSizes: Record<StudioPageFormat, { width: number; height: number }> = {
	A5: { width: 148, height: 210 },
	A4: { width: 210, height: 297 },
	A3: { width: 297, height: 420 },
}

export const studioPageSizeMm = (format: StudioPageFormat) => pageSizes[format]

export const pdfFileName = (title: string, label: string): string => {
	const unsafe = '<>:"/\\|?*'
	const safe = [ ...`${title || 'Конспект'} - ${label}` ]
		.map(character => character.charCodeAt(0) < 32 || unsafe.includes(character) ? ' - ' : character)
		.join('')
		.replace(/\s+-\s+/g, ' - ')
		.replace(/\s+/g, ' ')
		.replace(/[. ]+$/g, '')
		.trim()
	return `${safe || 'Конспект'}.pdf`
}

export const downloadStudioPdf = async (root: HTMLElement, title: string, label: string, format: StudioPageFormat): Promise<void> => {
	const pages = [ ...root.querySelectorAll<HTMLElement>('[data-pdf-page]') ]
	if (!pages.length) throw new Error('В предпросмотре нет готовых страниц.')
	const [ { default: html2canvas }, { jsPDF } ] = await Promise.all([ import('html2canvas'), import('jspdf') ])
	const paper = studioPageSizeMm(format)
	const orientation = paper.width > paper.height ? 'landscape' : 'portrait'
	let pdf: InstanceType<typeof jsPDF> | undefined
	for (const page of pages) {
		// Render an isolated, unscaled page at the viewport origin. Capturing the
		// positioned preview node directly makes html2canvas inherit the preview
		// frame offset, which can crop the header on later pages.
		const capturePage = page.cloneNode(true) as HTMLElement
		capturePage.removeAttribute('data-pdf-page')
		capturePage.setAttribute('aria-hidden', 'true')
		capturePage.querySelectorAll<HTMLElement>('[data-pdf-ignore="true"]').forEach(node => node.remove())
		Object.assign(capturePage.style, {
			position: 'fixed',
			inset: '0 auto auto 0',
			margin: '0',
			transform: 'none',
			boxShadow: 'none',
			pointerEvents: 'none',
			zIndex: '-2147483648',
		})
		document.body.appendChild(capturePage)
		let canvas: HTMLCanvasElement
		try {
			await Promise.all([ ...capturePage.querySelectorAll('img') ].map(image => image.decode().catch(() => undefined)))
			canvas = await html2canvas(capturePage, {
				backgroundColor: '#ffffff',
				scale: Math.max(2, window.devicePixelRatio || 1),
				useCORS: true,
				logging: false,
				scrollX: 0,
				scrollY: 0,
				windowWidth: capturePage.offsetWidth,
				windowHeight: capturePage.offsetHeight,
				width: capturePage.offsetWidth,
				height: capturePage.offsetHeight,
			})
		} finally {
			capturePage.remove()
		}
		if (!pdf) pdf = new jsPDF({ orientation, unit: 'mm', format: [ paper.width, paper.height ], compress: true })
		else pdf.addPage([ paper.width, paper.height ], orientation)
		pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, paper.width, paper.height, undefined, 'FAST')
	}
	pdf!.save(pdfFileName(title, label))
}
