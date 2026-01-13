const { YooCheckout } = require('@a2seven/yoo-checkout')
const { v4: uuid } = require('uuid')

class CheckoutService {
	constructor() {
		this.client = new YooCheckout({
			shopId: process.env.YOOCHECKOUT_SHOP_ID || '',
			secretKey: process.env.YOOCHECKOUT_KEY || '',
		})
	}

	generateKey() {
		return uuid()
	}

	createPayment(payload, key = this.generateKey()) {
		return this.client.createPayment(payload, key)
	}

	capturePayment(paymentId, payload = {}) {
		return this.client.capturePayment(paymentId, payload)
	}
	getPayment(paymentId) {
		return this.client.getPayment(paymentId)
	}
}

const checkout = new CheckoutService()

module.exports = { checkout }
