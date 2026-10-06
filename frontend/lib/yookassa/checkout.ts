import { randomUUID } from 'node:crypto'

const API_URL = 'https://api.yookassa.ru/v3'

export interface YooKassaAmount {
	value: string
	currency: string
}

export interface ICreatePayment {
	amount: YooKassaAmount
	capture: boolean
	description?: string
	confirmation?: { type: string; [key: string]: unknown }
	payment_method_id?: string
	save_payment_method?: boolean
	[key: string]: unknown
}

export interface Payment {
	id: string
	status: string
	amount: YooKassaAmount
	confirmation?: { confirmation_token?: string; [key: string]: unknown }
	payment_method?: { id: string; title?: string; [key: string]: unknown }
	[key: string]: unknown
}

export class YooKassaHttpError extends Error {
	constructor(public readonly status: number, public readonly responseBody: unknown) {
		super(`YooKassa request failed with HTTP ${status}`)
		this.name = 'YooKassaHttpError'
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPayment(value: unknown): value is Payment {
	return isRecord(value)
		&& typeof value.id === 'string'
		&& typeof value.status === 'string'
		&& isRecord(value.amount)
		&& typeof value.amount.value === 'string'
		&& typeof value.amount.currency === 'string'
}

class CheckoutService {
	generateKey(): string {
		return randomUUID()
	}

	async createPayment(payload: ICreatePayment, key = this.generateKey()): Promise<Payment> {
		return this.request('/payments', 'POST', payload, key)
	}

	async capturePayment(paymentId: string, payload: Record<string, unknown> = {}): Promise<Payment> {
		return this.request(`/payments/${encodeURIComponent(paymentId)}/capture`, 'POST', payload, this.generateKey())
	}

	async getPayment(paymentId: string): Promise<Payment> {
		return this.request(`/payments/${encodeURIComponent(paymentId)}`, 'GET')
	}

	private async request(
		path: string,
		method: 'GET' | 'POST',
		body?: unknown,
		idempotenceKey?: string
	): Promise<Payment> {
		const shopId = process.env.YOOCHECKOUT_SHOP_ID
		const secretKey = process.env.YOOCHECKOUT_KEY
		if (!shopId || !secretKey) throw new Error('YOOCHECKOUT_SHOP_ID and YOOCHECKOUT_KEY must be configured')

		const headers: Record<string, string> = {
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
		let responseBody: unknown = null
		if (rawBody) {
			try {
				responseBody = JSON.parse(rawBody)
			} catch {
				throw new YooKassaHttpError(response.status, rawBody)
			}
		}
		if (!response.ok) throw new YooKassaHttpError(response.status, responseBody)
		if (!isPayment(responseBody)) throw new YooKassaHttpError(response.status, responseBody)
		return responseBody
	}
}

export const checkout = new CheckoutService()
