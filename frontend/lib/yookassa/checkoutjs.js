/* eslint-disable @typescript-eslint/no-var-requires -- CommonJS cron helper */
const { randomUUID } = require('node:crypto')

const API_URL = 'https://api.yookassa.ru/v3'

function isPayment(value) {
	return value && typeof value === 'object'
		&& typeof value.id === 'string'
		&& typeof value.status === 'string'
		&& value.amount && typeof value.amount.value === 'string'
		&& typeof value.amount.currency === 'string'
}

class YooKassaHttpError extends Error {
	constructor(status, responseBody) {
		super(`YooKassa request failed with HTTP ${status}`)
		this.name = 'YooKassaHttpError'
		this.status = status
		this.responseBody = responseBody
	}
}

class CheckoutService {
	generateKey() {
		return randomUUID()
	}

	createPayment(payload, key = this.generateKey()) {
		return this.request('/payments', 'POST', payload, key)
	}

	capturePayment(paymentId, payload = {}) {
		return this.request(`/payments/${encodeURIComponent(paymentId)}/capture`, 'POST', payload, this.generateKey())
	}

	getPayment(paymentId) {
		return this.request(`/payments/${encodeURIComponent(paymentId)}`, 'GET')
	}

	async request(path, method, body, idempotenceKey) {
		const shopId = process.env.YOOCHECKOUT_SHOP_ID
		const secretKey = process.env.YOOCHECKOUT_KEY
		if (!shopId || !secretKey) throw new Error('YOOCHECKOUT_SHOP_ID and YOOCHECKOUT_KEY must be configured')

		const headers = {
			Accept: 'application/json',
			Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`, 'utf8').toString('base64')}`,
		}
		if (idempotenceKey) headers['Idempotence-Key'] = idempotenceKey
		if (body !== undefined) headers['Content-Type'] = 'application/json'

		const response = await fetch(`${API_URL}${path}`, {
			method,
			headers,
			body: body === undefined ? undefined : JSON.stringify(body),
		})
		const rawBody = await response.text()
		let responseBody = null
		if (rawBody) {
			try {
				responseBody = JSON.parse(rawBody)
			} catch {
				throw new YooKassaHttpError(response.status, rawBody)
			}
		}
		if (!response.ok || !isPayment(responseBody)) throw new YooKassaHttpError(response.status, responseBody)
		return responseBody
	}
}

const checkout = new CheckoutService()

module.exports = { checkout, YooKassaHttpError }
