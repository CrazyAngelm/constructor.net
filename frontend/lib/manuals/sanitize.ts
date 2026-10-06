import sanitizeHtml from 'sanitize-html'

const allowedTags = [
	...sanitizeHtml.defaults.allowedTags,
	'img',
	'video',
	'source',
]

export const sanitizeManualHtml = (value: string): string => sanitizeHtml(value, {
	allowedTags,
	allowedAttributes: {
		...sanitizeHtml.defaults.allowedAttributes,
		'*': [ 'class' ],
		img: [ 'src', 'alt', 'title', 'width', 'height' ],
		video: [ 'src', 'controls', 'width', 'height', 'poster' ],
		source: [ 'src', 'type' ],
	},
	allowedSchemesByTag: {
		img: [ 'http', 'https', 'data' ],
		video: [ 'http', 'https' ],
		source: [ 'http', 'https' ],
	},
})
