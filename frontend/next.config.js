const nextEnv = require('next-env')
const dotenvLoad = require('dotenv-load')

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	webpackDevMiddleware: config => {
		const poll = Number(process.env.NEXT_WATCH_POLL)
		const aggregateTimeout = Number(process.env.NEXT_WATCH_AGGREGATE_TIMEOUT)
		config.watchOptions = {}
		if (poll) config.watchOptions.poll = poll
		if (aggregateTimeout) config.watchOptions.aggregateTimeout = aggregateTimeout
		return config
	},
	webpack: (config, options) => {
		config.module.rules.push({
			test: /\.html$/i,
			loader: "html-loader"
		})
		config.module.rules.push({
			test: /\.js$/,
			exclude: /node_modules(?!\/quill-image-drop-module|quill-image-resize-module)/,
			loader: 'babel-loader'
		})
		return config
	}
}

const CroneClass = require('./lib/cronejs.js')

CroneClass.Init()

dotenvLoad()
const withNextEnv = nextEnv()

module.exports = withNextEnv(nextConfig)
