import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { AdvancePaymentOrder } from './booking.service';

interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface CheckoutOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  handler: (payment: RazorpayCheckoutResponse) => void;
  modal: { ondismiss: () => void };
}

type CheckoutConstructor = new (options: CheckoutOptions) => {
  open(): void;
  on(event: 'payment.failed', handler: () => void): void;
};

export type CheckoutResult =
  | { status: 'received'; payment: RazorpayCheckoutResponse }
  | { status: 'failed' | 'dismissed' };

@Injectable({ providedIn: 'root' })
export class RazorpayCheckoutService {
  private readonly document = inject(DOCUMENT);
  private loading?: Promise<CheckoutConstructor>;

  private get checkout() {
    return (this.document.defaultView as (Window & { Razorpay?: CheckoutConstructor }) | null)?.Razorpay;
  }

  async prepare(order: AdvancePaymentOrder, reference: string): Promise<() => Promise<CheckoutResult>> {
    if (!order.keyId.startsWith('rzp_test_') || !order.orderId.startsWith('order_')) {
      throw new Error('A valid Razorpay test order is required.');
    }
    const Checkout = await this.load();
    return () => new Promise<CheckoutResult>(resolve => {
      let failed = false;
      const checkout = new Checkout({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountInPaise,
        currency: order.currency,
        name: 'FarmStay',
        description: `Test advance · ${reference}`,
        handler: (payment) => resolve({ status: 'received', payment }),
        modal: { ondismiss: () => resolve({ status: failed ? 'failed' : 'dismissed' }) },
      });
      checkout.on('payment.failed', () => { failed = true; });
      checkout.open();
    });
  }

  private load(): Promise<CheckoutConstructor> {
    const existing = this.checkout;
    if (existing) return Promise.resolve(existing);

    return this.loading ??= new Promise<CheckoutConstructor>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      const fail = () => {
        clearTimeout(timeout);
        script.remove();
        this.loading = undefined;
        reject(new Error('Could not load Razorpay Checkout. Please try again.'));
      };
      const timeout = setTimeout(fail, 15_000);
      script.addEventListener('error', fail, { once: true });
      script.addEventListener('load', () => {
        const loaded = this.checkout;
        if (!loaded) { fail(); return; }
        clearTimeout(timeout);
        resolve(loaded);
      }, { once: true });
      this.document.head.append(script);
    });
  }
}
