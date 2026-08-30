import '@/styles/globals.css'
import 'bulma/bulma.sass'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import Script from 'next/script'

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<>
			<Script strategy="afterInteractive" src="https://yookassa.ru/checkout-widget/v1/checkout-widget.js" />
			<SessionProvider session={pageProps.session} refetchInterval={0}>
				<Component {...pageProps} />
			</SessionProvider>
		</>
	)
}

export default MyApp
