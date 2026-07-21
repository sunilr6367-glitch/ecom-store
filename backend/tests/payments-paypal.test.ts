import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildCheckoutPaymentTokenMetadata } from '../src/utils/payment-ownership';
import { buildInventoryReservationMetadata } from '../src/utils/inventory-reservation';

const mocks = vi.hoisted(() => ({
  selectRows: [] as any[],
  updates: [] as any[],
  fetch: vi.fn(),
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
      values: vi.fn(async () => []),
    })),
  },
}));

describe('PayPal payment routes', () => {
  let router: any;
  const checkoutToken = 'checkout-token-for-paypal-tests-123456';
  const order = {
    id: '11111111-1111-4111-8111-111111111111',
    customer_id: '22222222-2222-4222-8222-222222222222',
    email: 'buyer@example.com',
    display_id: 1001,
    total: 129900,
    currency_code: 'USD',
    payment_status: 'awaiting',
    status: 'pending',
    metadata: {
      ...buildCheckoutPaymentTokenMetadata(checkoutToken),
      ...buildInventoryReservationMetadata(),
      paypal_order_id: 'PAYPAL-ORDER-123',
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.PAYPAL_CLIENT_ID = 'paypal-client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'paypal-client-secret';
    process.env.PAYPAL_SANDBOX = 'true';
    process.env.PAYPAL_WEBHOOK_ID = 'paypal-webhook-id';
    vi.stubGlobal('fetch', mocks.fetch);
    router = (await import('../src/routes/store/payments-paypal')).default;
  });

  beforeEach(() => {
    mocks.selectRows = [{ orders: order, customers: { has_account: false } }];
    mocks.updates = [];
    mocks.fetch.mockReset();
  });

  it('rejects guest create-order without the checkout token', async () => {
    const response = await router.request('/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order.id }),
    });

    expect(response.status).toBe(401);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('creates a PayPal order with idempotency and server-owned amount', async () => {
    mocks.fetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'access-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'PAYPAL-ORDER-123' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const response = await router.request('/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: order.id,
        checkout_token: checkoutToken,
      }),
    });

    expect(response.status).toBe(200);
    const [, request] = mocks.fetch.mock.calls[1];
    expect(request.headers['PayPal-Request-Id']).toBe(
      `odhvica-create-${order.id}`
    );
    const requestBody = JSON.parse(request.body);
    expect(requestBody.purchase_units[0].amount).toEqual({
      currency_code: 'USD',
      value: '1299.00',
    });
    expect(
      requestBody.payment_source.paypal.experience_context.shipping_preference
    ).toBe('NO_SHIPPING');
  });

  it('rejects capture when PayPal amount differs from the database order', async () => {
    mocks.fetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'access-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'PAYPAL-ORDER-123',
            status: 'COMPLETED',
            purchase_units: [
              {
                reference_id: order.id,
                payments: {
                  captures: [
                    {
                      id: 'CAPTURE-123',
                      status: 'COMPLETED',
                      amount: {
                        currency_code: 'USD',
                        value: '1300.00',
                      },
                    },
                  ],
                },
              },
            ],
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

    const response = await router.request('/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: order.id,
        paypal_order_id: 'PAYPAL-ORDER-123',
        checkout_token: checkoutToken,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'PayPal payment amount mismatch',
    });
    expect(mocks.updates).toHaveLength(0);
  });

  it('rejects webhooks without the PayPal auth algorithm header', async () => {
    const response = await router.request('/webhook', {
      method: 'POST',
      headers: {
        'paypal-transmission-id': 'transmission-id',
        'paypal-transmission-time': new Date().toISOString(),
        'paypal-cert-url': 'https://api.paypal.com/cert.pem',
        'paypal-transmission-sig': 'signature',
      },
      body: JSON.stringify({
        id: 'WH-123',
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
      }),
    });

    expect(response.status).toBe(400);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
