type YooWidgetCtor = new (args: {
	confirmation_token: string
	return_url?: string
	customization: {
		modal: boolean
	}
	error_callback?: (error: unknown) => void
}) => { render: () => void }

export const YooCheckoutWidget = (token: string, returnUrl?: string,
	errorCallback?: (error: unknown) => void) => {

	const checkout = new (window as { YooMoneyCheckoutWidget: YooWidgetCtor }).YooMoneyCheckoutWidget({
		confirmation_token: token,
		return_url: returnUrl,
		customization: {
			modal: true,
		},
		error_callback: errorCallback,
	})

	checkout.render()
}
