/**
 * Razorpay Payment Routes
 *
 * Handles Indian (INR) payments via Razorpay:
 * - POST /store/payments/razorpay/create-order  — create Razorpay order
 * - POST /store/payments/razorpay/verify         — verify signature after payment
 * - POST /store/payments/razorpay/webhook        — Razorpay webhook handler
 *
 * Security:
 * - HMAC-SHA256 signature verification on verify endpoint
 * - HMAC-SHA256 webhook signature verification
 * - Idempotent webhook processing
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../../db';
import { customers, orders, webhook_events } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { logInfo, logError } from '../../utils/logger';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import { config } from '../../config';
import { isValidCheckoutPaymentToken } from '../../utils/payment-ownership';
import {
  isInventoryReservationActive,
  releaseInventoryReservation,
} from '../../utils/inventory-reservation';
import { claimWebhookEvent } from '../../utils/webhook-events';
import { finalizeCapturedPayment } from '../../utils/payment-capture';

const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_ID;
const rzpKeySecret =
  process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

const razorpay =
  rzpKeyId && rzpKeySecret
    ? new Razorpay({ key_id: rzpKeyId, key_secret: rzpKeySecret })
    : null;

const razorpayRouter = new Hono();

// --- SCHEMAS ---

const CreateRazorpayOrderSchema = z.object({
  order_id: z.string().uuid(),
  checkout_token: z.string().min(16).optional(),
});

const VerifyPaymentSchema = z.object({
  order_id: z.string().uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  checkout_token: z.string().min(16).optional(),
});

const MIN_RAZORPAY_AMOUNT = 100;

function getRazorpayErrorResponse(error: any, fallback: string) {
  const providerStatus = Number(error?.statusCode ?? error?.status);
  const status = providerStatus === 401 ? 401 : 500;
  const providerMessage = error?.error?.description || error?.message;

  return {
    status,
    message:
      status === 401
        ? 'Razorpay authentication failed'
        : providerMessage || fallback,
  } as const;
}

async function getOrderWithCustomer(orderId: string) {
  const [row] = await db
    .select()
    .from(orders)
    .leftJoin(customers, eq(orders.customer_id, customers.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  return row
    ? {
        order: row.orders,
        customer: row.customers,
      }
    : null;
}

function safeCompareHex(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(actual, 'hex');

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

async function requirePaymentOwnership(
  c: any,
  order: typeof orders.$inferSelect,
  customer: typeof customers.$inferSelect | null,
  checkoutToken?: string
) {
  if (
    !isInventoryReservationActive(
      order.metadata as Record<string, any> | null
    )
  ) {
    return {
      ok: false,
      response: c.json({ error: 'Checkout session expired' }, 410),
    };
  }

  // 1. First try to authorize with checkout session token
  // (This handles both guests and logged-in users during active checkout)
  if (
    checkoutToken &&
    isValidCheckoutPaymentToken(
      order.metadata as Record<string, any> | null,
      checkoutToken
    )
  ) {
    return { ok: true };
  }

  // 2. Fallback to auth token if checkout session token is missing/invalid
  // (e.g., user returns later to pay via an email link)
  if (order.customer_id && customer?.has_account) {
    const token = getCookie(c, 'auth_token');
    if (!token) return { ok: false, response: c.json({ error: 'Unauthorized' }, 401) };

    try {
      const payload = (await verify(token, config.jwt.secret, 'HS256')) as {
        sub: string;
        role: string;
      };
      if (payload.role !== 'customer' || payload.sub !== order.customer_id) {
        return { ok: false, response: c.json({ error: 'Forbidden' }, 403) };
      }
      return { ok: true };
    } catch {
      return { ok: false, response: c.json({ error: 'Unauthorized' }, 401) };
    }
  }

  return { ok: false, response: c.json({ error: 'Invalid checkout session' }, 401) };
}

function getStoredRazorpayOrderId(order: typeof orders.$inferSelect) {
  const metadata = (order.metadata as Record<string, any> | null) || {};
  return typeof metadata.razorpay_order_id === 'string'
    ? metadata.razorpay_order_id
    : null;
}

function getWebhookEntity(event: any) {
  return (
    event.payload?.payment?.entity ||
    event.payload?.refund?.entity ||
    event.payload?.order?.entity ||
    null
  );
}

function getWebhookEventId(c: any, payload: string, event: any) {
  return (
    c.req.header('x-razorpay-event-id') ||
    event.id ||
    getWebhookEntity(event)?.id ||
    crypto.createHash('sha256').update(payload).digest('hex')
  );
}

function getOrderIdFromPayment(payment: any) {
  return payment?.notes?.order_id || null;
}

function getOrderIdFromRazorpayOrder(order: any) {
  return order?.notes?.order_id || order?.receipt || null;
}

function getOrderIdFromRefund(refund: any) {
  return refund?.notes?.order_id || null;
}

// --- ROUTES ---

// POST /store/payments/razorpay/create-order
razorpayRouter.post(
  '/create-order',
  zValidator('json', CreateRazorpayOrderSchema),
  async (c) => {
    try {
      if (!razorpay) {
        return c.json({ error: 'Razorpay not configured' }, 503);
      }

      const { order_id, checkout_token } = c.req.valid('json');

      const orderRow = await getOrderWithCustomer(order_id);

      if (!orderRow) {
        return c.json({ error: 'Order not found' }, 404);
      }

      const { order, customer } = orderRow;
      const ownership = await requirePaymentOwnership(
        c,
        order,
        customer,
        checkout_token
      );
      if (!ownership.ok) {
        return ownership.response;
      }

      if (order.payment_status === 'captured') {
        return c.json({ error: 'Order already paid' }, 400);
      }

      if (['cancelled', 'refunded'].includes(order.status ?? '')) {
        return c.json({ error: 'Cannot create payment for this order' }, 400);
      }

      if ((order.currency_code || '').toUpperCase() !== 'INR') {
        return c.json({ error: 'Razorpay is available only for INR orders' }, 400);
      }

      // Razorpay expects amount in paise (smallest INR unit = 1/100 rupee)
      // Our DB stores amounts in paise already (cents-equivalent)
      const amountInPaise = Math.round(Number(order.total));

      if (!Number.isSafeInteger(amountInPaise) || amountInPaise < MIN_RAZORPAY_AMOUNT) {
        return c.json(
          { error: 'Order total must be at least 100 paise' },
          400
        );
      }

      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: (order.currency_code || 'INR').toUpperCase(),
        receipt: order.id,
        notes: {
          order_id: order.id,
          display_id: order.display_id?.toString() || '',
          email: order.email,
        },
      });

      // Store Razorpay order ID in order metadata
      await db
        .update(orders)
        .set({
          metadata: {
            ...((order.metadata as Record<string, any>) || {}),
            razorpay_order_id: rzpOrder.id,
          },
        })
        .where(eq(orders.id, order_id));

      return c.json({
        razorpay_order_id: rzpOrder.id,
        amount: amountInPaise,
        currency: (order.currency_code || 'INR').toUpperCase(),
        key_id: rzpKeyId,
      });
    } catch (error: any) {
      logError('Razorpay order creation failed', error);
      const response = getRazorpayErrorResponse(
        error,
        'Failed to initialize Razorpay payment'
      );
      return c.json({ error: response.message }, response.status);
    }
  }
);

// POST /store/payments/razorpay/verify
// Client calls this after Razorpay checkout completes to verify payment
razorpayRouter.post(
  '/verify',
  zValidator('json', VerifyPaymentSchema),
  async (c) => {
    try {
      if (!rzpKeySecret) {
        return c.json({ error: 'Razorpay not configured' }, 503);
      }

      const {
        order_id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        checkout_token,
      } = c.req.valid('json');

      const orderRow = await getOrderWithCustomer(order_id);

      if (!orderRow) {
        return c.json({ error: 'Order not found' }, 404);
      }

      const { order: existingOrder, customer } = orderRow;
      const ownership = await requirePaymentOwnership(
        c,
        existingOrder,
        customer,
        checkout_token
      );
      if (!ownership.ok) {
        return ownership.response;
      }

      const storedRazorpayOrderId = getStoredRazorpayOrderId(existingOrder);

      if (!storedRazorpayOrderId) {
        return c.json({ error: 'Razorpay order not initialized' }, 400);
      }

      if (razorpay_order_id !== storedRazorpayOrderId) {
        logError('Razorpay order ID mismatch during verification', {
          order_id,
          received_razorpay_order_id: razorpay_order_id,
          stored_razorpay_order_id: storedRazorpayOrderId,
        });
        return c.json({ error: 'Invalid Razorpay order' }, 400);
      }

      // Verify HMAC-SHA256 signature with the server-stored Razorpay order ID.
      const expectedSignature = crypto
        .createHmac('sha256', rzpKeySecret)
        .update(`${storedRazorpayOrderId}|${razorpay_payment_id}`)
        .digest('hex');

      if (!safeCompareHex(expectedSignature, razorpay_signature)) {
        logError('Razorpay signature verification failed', {
          order_id,
          razorpay_order_id: storedRazorpayOrderId,
        });
        return c.json({ error: 'Invalid payment signature' }, 400);
      }

      if (!razorpay) {
        return c.json({ error: 'Razorpay not configured' }, 503);
      }

      let payment = (await razorpay.payments.fetch(
        razorpay_payment_id
      )) as any;

      if (payment.order_id !== storedRazorpayOrderId) {
        return c.json({ error: 'Payment does not belong to this order' }, 400);
      }

      const expectedAmount = Math.round(Number(existingOrder.total));
      if (Number(payment.amount) !== expectedAmount) {
        logError('Razorpay payment amount mismatch', {
          order_id,
          expected_amount: expectedAmount,
          received_amount: payment.amount,
        });
        return c.json({ error: 'Payment amount mismatch' }, 400);
      }

      const expectedCurrency = (existingOrder.currency_code || 'INR').toUpperCase();
      if ((payment.currency || '').toUpperCase() !== expectedCurrency) {
        return c.json({ error: 'Payment currency mismatch' }, 400);
      }

      if (payment.status === 'authorized') {
        payment = (await razorpay.payments.capture(
          razorpay_payment_id,
          expectedAmount,
          expectedCurrency
        )) as any;
      }

      if (payment.status !== 'captured') {
        return c.json({ error: `Payment is not captured (${payment.status})` }, 400);
      }

      // Mark order as paid
      const completed = await finalizeCapturedPayment(order_id, {
        razorpay_order_id: storedRazorpayOrderId,
        razorpay_payment_id,
        razorpay_payment_status: payment.status,
        razorpay_payment_amount: payment.amount,
        razorpay_payment_currency: payment.currency,
        payment_provider: 'razorpay',
        paid_at: new Date().toISOString(),
      });
      if (!completed) {
        return c.json(
          { error: 'Payment received after checkout expiry; support review required' },
          409
        );
      }

      logInfo(`Razorpay payment verified for order ${order_id}`);

      // Send order confirmation email AFTER successful payment
      try {
        const { emailService } = await import('../../services/email-service');
        const finalOrder = await db
          .select()
          .from(orders)
          .where(eq(orders.id, order_id))
          .limit(1)
          .then((r) => r[0]);
        if (finalOrder?.display_id) {
          await emailService.sendOrderConfirmation(
            {
              ...finalOrder,
              order_number: finalOrder.display_id.toString(),
            },
            finalOrder.email
          );
          logInfo(`Order confirmation email sent for order #${finalOrder.display_id}`);
        }
      } catch (emailError: unknown) {
        logError('Failed to send order confirmation email after payment', emailError);
      }

      return c.json({ success: true });
    } catch (error: any) {
      logError('Razorpay verify failed', error);
      const response = getRazorpayErrorResponse(
        error,
        'Failed to verify Razorpay payment'
      );
      return c.json({ error: response.message }, response.status);
    }
  }
);

// POST /store/payments/razorpay/webhook
razorpayRouter.post('/webhook', async (c) => {
  const payload = await c.req.text();
  const signature = c.req.header('x-razorpay-signature');

  if (!signature) {
    return c.json({ error: 'No signature' }, 400);
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logError('RAZORPAY_WEBHOOK_SECRET not configured');
    return c.json({ error: 'Webhook not configured' }, 500);
  }

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  if (!safeCompareHex(expectedSignature, signature)) {
    logError('Razorpay webhook signature mismatch');
    return c.json({ error: 'Invalid signature' }, 400);
  }

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const eventId = getWebhookEventId(c, payload, event);
  const storedEventId = `razorpay_${eventId}`;
  const eventType = event.event;

  const claim = await claimWebhookEvent(storedEventId, eventType);
  if (!claim.claimed) {
    logInfo(`Duplicate Razorpay webhook event ${eventId}`);
    return c.json({ received: true, duplicate: true });
  }

  try {
    switch (eventType) {
      case 'payment.authorized': {
        const payment = event.payload?.payment?.entity;
        const orderId = getOrderIdFromPayment(payment);

        if (orderId) {
          const [existingOrder] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

          if (existingOrder) {
            await db
              .update(orders)
              .set({
                payment_status: 'authorized',
                metadata: {
                  ...((existingOrder.metadata as Record<string, any>) || {}),
                  razorpay_payment_id: payment.id,
                  razorpay_order_id: payment.order_id,
                  razorpay_payment_status: payment.status,
                  payment_provider: 'razorpay',
                  authorized_at: new Date().toISOString(),
                },
              })
              .where(eq(orders.id, orderId));
          }
        }
        break;
      }

      case 'payment.captured': {
        const payment = event.payload?.payment?.entity;
        const orderId = getOrderIdFromPayment(payment);

        if (orderId) {
          const [existingOrder] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

          if (existingOrder) {
            const completed = await finalizeCapturedPayment(orderId, {
              razorpay_payment_id: payment.id,
              razorpay_order_id: payment.order_id,
              razorpay_payment_status: payment.status,
              razorpay_payment_amount: payment.amount,
              razorpay_payment_currency: payment.currency,
              payment_provider: 'razorpay',
              paid_at: new Date().toISOString(),
            });

            if (!completed) {
              logError(`Razorpay payment review required for order ${orderId}`);
            } else {
              logInfo(`Razorpay payment captured for order ${orderId}`);
            }
          }
        }
        break;
      }

      case 'order.paid': {
        const razorpayOrder = event.payload?.order?.entity;
        const orderId = getOrderIdFromRazorpayOrder(razorpayOrder);

        if (orderId) {
          const [existingOrder] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

          if (existingOrder) {
            await finalizeCapturedPayment(orderId, {
              razorpay_order_id: razorpayOrder.id,
              razorpay_order_status: razorpayOrder.status,
              payment_provider: 'razorpay',
              paid_at: new Date().toISOString(),
            });
          }
        }
        break;
      }

      case 'payment.failed': {
        const payment = event.payload?.payment?.entity;
        const orderId = getOrderIdFromPayment(payment);

        if (orderId) {
          const [existingOrder] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

          if (existingOrder) {
            await db
              .update(orders)
              .set({
                status: 'cancelled',
                payment_status: 'failed',
                metadata: {
                  ...((existingOrder.metadata as Record<string, any>) || {}),
                  razorpay_payment_id: payment.id,
                  razorpay_order_id: payment.order_id,
                  razorpay_payment_status: payment.status,
                  payment_provider: 'razorpay',
                  payment_failed_at: new Date().toISOString(),
                  payment_failure_reason: payment.error_description,
                },
              })
              .where(eq(orders.id, orderId));

            await releaseInventoryReservation(
              orderId,
              'razorpay_payment_failed'
            );
            logInfo(`Razorpay payment failed for order ${orderId}`);
          }
        }
        break;
      }

      case 'refund.created':
      case 'refund.processed': {
        const refund = event.payload?.refund?.entity;
        const paymentId = refund?.payment_id;

        if (paymentId) {
          const orderId = getOrderIdFromRefund(refund);
          const [order] = orderId
            ? await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
            : await db
                .select()
                .from(orders)
                .where(
                  sql`${orders.metadata}->>'razorpay_payment_id' = ${paymentId}`
                )
                .limit(1);

          if (order) {
            await db
              .update(orders)
              .set({
                payment_status:
                  eventType === 'refund.processed' ? 'refunded' : 'refund_pending',
                metadata: {
                  ...((order.metadata as Record<string, any>) || {}),
                  razorpay_refund_id: refund.id,
                  razorpay_refund_status: refund.status,
                  ...(eventType === 'refund.processed'
                    ? { refunded_at: new Date().toISOString() }
                    : { refund_created_at: new Date().toISOString() }),
                },
              })
              .where(eq(orders.id, order.id));

            logInfo(`Razorpay refund for order ${order.id}`);
          }
        }
        break;
      }

      case 'refund.failed': {
        const refund = event.payload?.refund?.entity;
        const paymentId = refund?.payment_id;
        if (paymentId) {
          const [order] = await db
            .select()
            .from(orders)
            .where(sql`${orders.metadata}->>'razorpay_payment_id' = ${paymentId}`)
            .limit(1);

          if (order) {
            await db
              .update(orders)
              .set({
                payment_status: 'refund_failed',
                metadata: {
                  ...((order.metadata as Record<string, any>) || {}),
                  razorpay_refund_id: refund.id,
                  razorpay_refund_status: refund.status,
                  refund_failed_at: new Date().toISOString(),
                  refund_failure_reason: refund.error_description || null,
                },
              })
              .where(eq(orders.id, order.id));
          }
        }
        break;
      }

      default:
        logInfo(`Unhandled Razorpay event: ${eventType}`);
    }

    await db
      .update(webhook_events)
      .set({ processed_at: new Date(), status: 'processed' })
      .where(eq(webhook_events.event_id, storedEventId));

    return c.json({ received: true });
  } catch (error: any) {
    logError('Razorpay webhook processing error', error);
    await db
      .update(webhook_events)
      .set({ status: 'failed' })
      .where(eq(webhook_events.event_id, storedEventId));
    return c.json({ error: error.message }, 500);
  }
});

export default razorpayRouter;
