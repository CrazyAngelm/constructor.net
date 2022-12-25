import '@/styles/globals.css'
import 'bulma/bulma.sass'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import Head from 'next/head'

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<>
			<Head>
				<script crossOrigin='anonymous' src="https://yookassa.ru/checkout-widget/v1/checkout-widget.js" />
			</Head>
			<SessionProvider session={pageProps.session} refetchInterval={0}>
				<Component {...pageProps} />
			</SessionProvider>
		</>
	)
}

export default MyApp
