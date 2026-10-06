import 'bulma/bulma.sass'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import Head from 'next/head'

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<>
			<Head><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Lab Studio</title><link rel="icon" href="/logo.png" /></Head>
			<SessionProvider session={pageProps.session} refetchInterval={0}>
				<Component {...pageProps} />
			</SessionProvider>
		</>
	)
}

export default MyApp
