import { YooCheckout, ICreatePayment } from "@a2seven/yoo-checkout";
import { v4 as uuid } from "uuid";

class CheckoutService {
	private readonly client: YooCheckout;

	constructor() {
		this.client = new YooCheckout({
			shopId: process.env.YOOCHECKOUT_SHOP_ID ?? "",
			secretKey: process.env.YOOCHECKOUT_KEY ?? ""
		});
	}

	generateKey(): string {
		return uuid();
	}

	createPayment(payload: ICreatePayment, key = this.generateKey()) {
		return this.client.createPayment(payload, key);
	}

	capturePayment(paymentId: string, payload = {}) {
		return this.client.capturePayment(paymentId, payload);
	}

	getPayment(paymentId: string) {
		return this.client.getPayment(paymentId);
	}
}

export const checkout = new CheckoutService();
export type { ICreatePayment };
