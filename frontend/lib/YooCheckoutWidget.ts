export const YooCheckoutWidget = (token: string, returnUrl?: string,
	errorCallback?: (error: any) => void) => {

	const checkout = new (window as any).YooMoneyCheckoutWidget({
		confirmation_token: token,
		return_url: returnUrl,
		customization: {
			modal: true,
		},
		error_callback: errorCallback,
	})

	checkout.render()
}
