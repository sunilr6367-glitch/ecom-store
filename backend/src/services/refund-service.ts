import Stripe from 'stripe';
import Razorpay from 'razorpay';

type RefundableOrder = {
  id: string;
  total: number;
  currency_code: string;
  metadata: unknown;
};

export type ProviderRefund = {
  provider: 'stripe' | 'razorpay' | 'paypal';
  id: string;
  status: string;
};

async function getPaypalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('PayPal is not configured');

  const baseUrl =
    process.env.PAYPAL_SANDBOX === 'true'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`PayPal authentication failed (${response.status})`);
  return {
    baseUrl,
    token: ((await response.json()) as { access_token: string }).access_token,
  };
}

function toProviderAmount(amount: number, currency: string) {
  return ['JPY', 'HUF', 'TWD', 'KRW'].includes(currency.toUpperCase())
    ? String(Math.round(amount))
    : (amount / 100).toFixed(2);
}

export async function createProviderRefund(
  order: RefundableOrder,
  amount: number,
  returnId: string
): Promise<ProviderRefund> {
  if (!Number.isInteger(amount) || amount <= 0 || amount > Number(order.total)) {
    throw new Error('Invalid refund amount');
  }

  const metadata = (order.metadata as Record<string, any> | null) || {};
  const provider =
    metadata.payment_provider ||
    (metadata.stripe_payment_intent_id
      ? 'stripe'
      : metadata.razorpay_payment_id
        ? 'razorpay'
        : metadata.paypal_capture_id
          ? 'paypal'
          : null);

  if (provider === 'stripe') {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey || !metadata.stripe_payment_intent_id) {
      throw new Error('Stripe refund details are unavailable');
    }
    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-05.acacia' as any,
    });
    const refund = await stripe.refunds.create(
      {
        payment_intent: metadata.stripe_payment_intent_id,
        amount,
        metadata: { order_id: order.id, return_id: returnId },
      },
      { idempotencyKey: `return-${returnId}` }
    );
    return { provider, id: refund.id, status: refund.status || 'pending' };
  }

  if (provider === 'razorpay') {
    if (
      !process.env.RAZORPAY_ID ||
      !process.env.RAZORPAY_SECRET ||
      !metadata.razorpay_payment_id
    ) {
      throw new Error('Razorpay refund details are unavailable');
    }
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
    const refund = (await razorpay.payments.refund(
      metadata.razorpay_payment_id,
      {
        amount,
        notes: { order_id: order.id, return_id: returnId },
        receipt: returnId,
      } as any
    )) as any;
    return { provider, id: refund.id, status: refund.status || 'pending' };
  }

  if (provider === 'paypal') {
    if (!metadata.paypal_capture_id) {
      throw new Error('PayPal refund details are unavailable');
    }
    const { baseUrl, token } = await getPaypalAccessToken();
    const response = await fetch(
      `${baseUrl}/v2/payments/captures/${metadata.paypal_capture_id}/refund`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `return-${returnId}`,
        },
        body: JSON.stringify({
          amount: {
            currency_code: order.currency_code.toUpperCase(),
            value: toProviderAmount(amount, order.currency_code),
          },
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!response.ok) {
      throw new Error(`PayPal refund failed (${response.status})`);
    }
    const refund = (await response.json()) as { id: string; status: string };
    return { provider, id: refund.id, status: refund.status || 'pending' };
  }

  throw new Error('No captured payment provider is associated with this order');
}
