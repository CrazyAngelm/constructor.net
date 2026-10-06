import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkout } from './checkout'

const payment = {
	id: 'payment-id',
	status: 'pending',
	amount: { value: '1.00', currency: 'RUB' },
	confirmation: {},
	payment_method: { id: 'method-id' },
}

describe('YooKassa checkout client', () => {
	beforeEach(() => {
		process.env.YOOCHECKOUT_SHOP_ID = 'shop'
		process.env.YOOCHECKOUT_KEY = 'secret'
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('creates a payment with Basic authentication and the supplied idempotence key', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payment), { status: 200 }))
		vi.stubGlobal('fetch', fetchMock)

		await expect(checkout.createPayment({ amount: payment.amount, capture: true }, 'request-key')).resolves.toEqual(payment)

		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.yookassa.ru/v3/payments',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					Authorization: 'Basic c2hvcDpzZWNyZXQ=',
					'Idempotence-Key': 'request-key',
				}),
				body: JSON.stringify({ amount: payment.amount, capture: true }),
			})
		)
	})

	it('rejects non-success HTTP responses with the parsed YooKassa error', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'invalid_request' }), { status: 400 })))

		await expect(checkout.getPayment('payment/id')).rejects.toMatchObject({
			name: 'YooKassaHttpError',
			status: 400,
			responseBody: { code: 'invalid_request' },
		})
	})
})
