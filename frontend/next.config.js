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
	webpack:(config,options) => {
		config.module.rules.push({
				test: /\.html$/i,
				loader: "html-loader"
		})
		return config
	}
}

dotenvLoad()
const withNextEnv = nextEnv()

module.exports = withNextEnv(nextConfig)
