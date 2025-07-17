import type { ICreatePayment, Payment } from '@a2seven/yoo-checkout';

export declare const checkout: {
	generateKey(): string;
	createPayment(payload: ICreatePayment, key?: string): Promise<Payment>;
	capturePayment(paymentId: string, payload?: object): Promise<Payment>;
};

export type { ICreatePayment };
