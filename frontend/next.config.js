const { PHASE_PRODUCTION_SERVER } = require('next/constants')

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	webpack: (config, { dev }) => {
		if (dev) {
			const poll = Number(process.env.NEXT_WATCH_POLL)
			const aggregateTimeout = Number(process.env.NEXT_WATCH_AGGREGATE_TIMEOUT)
			if (poll || aggregateTimeout) config.watchOptions = {
				...(poll ? { poll } : {}),
				...(aggregateTimeout ? { aggregateTimeout } : {}),
			}
		}
		config.module.rules.push({
			test: /\.html$/i,
			loader: 'html-loader',
		})
		return config
	}
}

module.exports = (phase) => {
	const isIsolatedPreview = process.env.PREVIEW_DEPLOYMENT_MODE === 'isolated-preview'
	if (phase === PHASE_PRODUCTION_SERVER && !isIsolatedPreview && process.env.BILLING_CRON_ENABLED === 'true') {
		const CroneClass = require('./lib/cronejs.js')
		CroneClass.init()
	}
	return nextConfig
}
