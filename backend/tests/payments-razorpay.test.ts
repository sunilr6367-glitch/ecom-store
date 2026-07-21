import crypto from 'crypto';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildCheckoutPaymentTokenMetadata } from '../src/utils/payment-ownership';
import { buildInventoryReservationMetadata } from '../src/utils/inventory-reservation';

const mocks = vi.hoisted(() => ({
  selectRows: [] as any[],
  insertError: null as any,
  inserts: [] as any[],
  updates: [] as any[],
  ordersCreate: vi.fn(),
  paymentsFetch: vi.fn(),
  paymentsCapture: vi.fn(),
}));

vi.mock('../src/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => mocks.selectRows),
          })),
        })),
        where: vi.fn(() => ({
          limit: vi.fn(async () => mocks.selectRows),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn((values) => {
        mocks.updates.push(values);
        return {
          where: vi.fn(async () => []),
        };
      }),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(async (values) => {
        if (mocks.insertError) throw mocks.insertError;
        mocks.inserts.push(values);
        return [];
      }),
    })),
  },
}));

vi.mock('razorpay', () => ({
  default: class MockRazorpay {
    orders = {
      create: mocks.ordersCreate,
    };

    payments = {
      fetch: mocks.paymentsFetch,
      capture: mocks.paymentsCapture,
    };
  },
}));

describe('Razorpay payment routes', () => {
  let router: any;
  const checkoutToken = 'checkout-token-for-tests-123456';

  const order = {
    id: '11111111-1111-4111-8111-111111111111',
    customer_id: '22222222-2222-4222-8222-222222222222',
    email: 'buyer@example.com',
    display_id: 1001,
    total: 129900,
    currency_code: 'INR',
    payment_status: 'awaiting',
    status: 'pending',
    metadata: {
      ...buildCheckoutPaymentTokenMetadata(checkoutToken),
      ...buildInventoryReservationMetadata(),
      razorpay_order_id: 'order_rzp_123',
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.RAZORPAY_KEY_ID = 'rzp_test_123';
    process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_123';
    process.env.RAZORPAY_ID = 'rzp_test_123';
    process.env.RAZORPAY_SECRET = 'rzp_secret_123';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook_secret_123';
    router = (await import('../src/routes/store/payments-razorpay')).default;
  });

  beforeEach(() => {
    mocks.selectRows = [{ orders: order, customers: { has_account: false } }];
    mocks.insertError = null;
    mocks.inserts = [];
    mocks.updates = [];
    mocks.ordersCreate.mockReset();
    mocks.paymentsFetch.mockReset();
    mocks.paymentsCapture.mockReset();
  });

  it('rejects guest create-order without the checkout token', async () => {
    const response = await router.request('/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order.id }),
    });

    expect(response.status).toBe(401);
    expect(mocks.ordersCreate).not.toHaveBeenCalled();
  });

  it('creates a Razorpay order from the server-owned order total', async () => {
    mocks.ordersCreate.mockResolvedValue({ id: 'order_new_123' });

    const response = await router.request('/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: order.id,
        checkout_token: checkoutToken,
      }),
    });

    expect(response.status).toBe(200);
    expect(mocks.ordersCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: order.total,
        currency: 'INR',
        receipt: order.id,
      })
    );
    expect(await response.json()).toEqual(
      expect.objectContaining({
        razorpay_order_id: 'order_new_123',
        amount: order.total,
        currency: 'INR',
      })
    );
  });

  it('rejects an order below the 100 paise minimum', async () => {
    mocks.selectRows = [
      {
        orders: { ...order, total: 99 },
        customers: { has_account: false },
      },
    ];

    const response = await router.request('/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: order.id,
        checkout_token: checkoutToken,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Order total must be at least 100 paise',
    });
    expect(mocks.ordersCreate).not.toHaveBeenCalled();
  });

  it('returns 401 when Razorpay rejects the API credentials', async () => {
    mocks.ordersCreate.mockRejectedValue({
      statusCode: 401,
      error: { description: 'Authentication failed' },
    });

    const response = await router.request('/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: order.id,
        checkout_token: checkoutToken,
      }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: 'Razorpay authentication failed',
    });
  });

  it('rejects verify when the client Razorpay order id differs from stored metadata', async () => {
    const response = await router.request('/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: order.id,
        razorpay_order_id: 'order_attacker',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: '00',
        checkout_token: checkoutToken,
      }),
    });

    expect(response.status).toBe(400);
    expect(mocks.paymentsFetch).not.toHaveBeenCalled();
  });

  it('rejects an invalid payment signature without fetching the payment', async () => {
    const response = await router.request('/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: order.id,
        razorpay_order_id: order.metadata.razorpay_order_id,
        razorpay_payment_id: 'pay_123',
        razorpay_signature: '0'.repeat(64),
        checkout_token: checkoutToken,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid payment signature',
    });
    expect(mocks.paymentsFetch).not.toHaveBeenCalled();
  });

  it('rejects verify when the fetched payment amount does not match the order total', async () => {
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET!)
      .update(`${order.metadata.razorpay_order_id}|pay_123`)
      .digest('hex');
    mocks.paymentsFetch.mockResolvedValue({
      id: 'pay_123',
      order_id: order.metadata.razorpay_order_id,
      amount: order.total + 100,
      currency: 'INR',
      status: 'captured',
    });

    const response = await router.request('/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: order.id,
        razorpay_order_id: order.metadata.razorpay_order_id,
        razorpay_payment_id: 'pay_123',
        razorpay_signature: signature,
        checkout_token: checkoutToken,
      }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Payment amount mismatch');
  });

  it('ignores duplicate webhook deliveries using the Razorpay event id header', async () => {
    const payload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_123',
            order_id: order.metadata.razorpay_order_id,
            notes: { order_id: order.id },
          },
        },
      },
    });
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex');
    mocks.insertError = { code: '23505' };

    const response = await router.request('/webhook', {
      method: 'POST',
      headers: {
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': 'evt_123',
      },
      body: payload,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, duplicate: true });
  });
});
