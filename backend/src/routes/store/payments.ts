/**
 * Payment Routes
 *
 * These routes handle Stripe payment processing including:
 * - PaymentIntent creation for orders
 * - Payment status checking
 * - Stripe webhook handling with idempotency
 * - Payment success/failure/refund handling
 *
 * Security Features:
 * - Stripe signature verification on webhooks
 * - Idempotent webhook processing (prevents double charges)
 * - Log sanitization (PII not logged)
 *
 * @module payments
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import Stripe from 'stripe';
import { db } from '../../db';
import { customers, orders, line_items, webhook_events } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { logInfo, logError } from '../../utils/logger';
import { asyncHandler } from '../../middleware/error-handler';
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

// Only create Stripe instance if key is available
const stripeKey = process.env.STRIPE_SECRET_KEY;

let stripeInstance: Stripe | null = null;
function getStripe() {
  if (stripeInstance) return stripeInstance;
  if (!stripeKey || stripeKey.includes('replace_before_launch')) return null;
  try {
    stripeInstance = new Stripe(stripeKey, {
      apiVersion: '2025-02-05.acacia' as any,
    });
    return stripeInstance;
  } catch (error) {
    return null;
  }
}

const paymentRouter = new Hono();

// --- SCHEMAS ---

const CreatePaymentIntentSchema = z.object({
  order_id: z.string().uuid(),
  checkout_token: z.string().min(16).optional(),
});

async function requirePaymentOwnership(
  c: any,
  order: typeof orders.$inferSelect,
  customer: typeof customers.$inferSelect | null,
  checkoutToken?: string
) {
  if (order.customer_id && customer?.has_account) {
    const token = getCookie(c, 'auth_token');
    if (!token) return c.json({ error: 'Unauthorized' }, 401);
    try {
      const payload = (await verify(token, config.jwt.secret, 'HS256')) as {
        sub: string;
        role: string;
      };
      if (payload.role !== 'customer' || payload.sub !== order.customer_id) {
        return c.json({ error: 'Forbidden' }, 403);
      }
      return null;
    } catch {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  }

  return isValidCheckoutPaymentToken(
    order.metadata as Record<string, any> | null,
    checkoutToken
  )
    ? null
    : c.json({ error: 'Invalid checkout session' }, 401);
}

// --- ROUTES ---

// POST /store/payments/create-intent
// Creates a Stripe PaymentIntent for an order
paymentRouter.post(
  '/create-intent',
  zValidator('json', CreatePaymentIntentSchema),
  async (c) => {
    try {
      // Fail fast if Stripe is not configured
      const stripe = getStripe();
      if (!stripe) {
        return c.json({ error: 'Payment processing not configured' }, 503);
      }

      const { order_id, checkout_token } = c.req.valid('json');

      // Fetch the order with line items
      const [orderRow] = await db
        .select()
        .from(orders)
        .leftJoin(customers, eq(orders.customer_id, customers.id))
        .where(eq(orders.id, order_id))
        .limit(1);

      if (!orderRow) {
        return c.json({ error: 'Order not found' }, 404);
      }

      const order = orderRow.orders;
      const ownershipError = await requirePaymentOwnership(
        c,
        order,
        orderRow.customers,
        checkout_token
      );
      if (ownershipError) return ownershipError;

      if (
        !isInventoryReservationActive(
          order.metadata as Record<string, any> | null
        )
      ) {
        return c.json({ error: 'Checkout session expired' }, 410);
      }

      if (order.payment_status === 'captured') {
        return c.json({ error: 'Order already paid' }, 400);
      }

      // Prevent creating intent on cancelled/refunded orders
      if (['cancelled', 'refunded'].includes(order.status ?? '')) {
        return c.json({ error: 'Cannot create payment for this order' }, 400);
      }

      // Fetch line items for the order (for metadata/receipts if needed later)
      // Keeping variable for consistency with original code
      const items = await db
        .select()
        .from(line_items)
        .where(eq(line_items.order_id, order_id));

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(order.total)), // BUG-001 FIX: total is already in cents
        currency: order.currency_code.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          order_id: order.id,
          order_display_id: order.display_id?.toString() || '',
          customer_email: order.email,
        },
        description: `Order #${order.display_id} - ${order.email}`,
      });

      // Update order with payment intent ID
      await db
        .update(orders)
        .set({
          metadata: {
            // Merge existing metadata safely
            ...(order.metadata as Record<string, any>),
            stripe_payment_intent_id: paymentIntent.id,
          },
        })
        .where(eq(orders.id, order_id));

      return c.json({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      });
    } catch (error: any) {
      logError('Payment intent creation failed', error);
      return c.json({ error: error.message }, 500);
    }
  }
);

// GET /store/payments/status/:order_id
// Check payment status of an order
paymentRouter.get('/status/:order_id', async (c) => {
  try {
    const order_id = c.req.param('order_id');

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, order_id))
      .limit(1);

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    return c.json({
      order_id: order.id,
      payment_status: order.payment_status,
      status: order.status,
    });
  } catch (error: any) {
    logError('Payment status check failed', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /store/payments/webhook
// Stripe webhook handler for payment events
paymentRouter.post('/webhook', async (c) => {
  const payload = await c.req.text();
  const signature = c.req.header('stripe-signature');

  if (!signature) {
    return c.json({ error: 'No signature' }, 400);
  }

  let event: Stripe.Event;

  try {
    // BUG-006 FIX: Reject webhooks if secret is not configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logError('STRIPE_WEBHOOK_SECRET not configured');
      return c.json({ error: 'Webhook processing not configured' }, 500);
    }

    const stripe = getStripe();
    if (!stripe) return c.json({ error: 'Stripe disabled' }, 503);
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    logError('Webhook signature verification failed', err);
    return c.json({ error: `Webhook Error: ${err.message}` }, 400);
  }

  // 🔒 FIX-007: Idempotency check - insert first to prevent race conditions
  const eventId = event.id;
  const eventType = event.type;

  const claim = await claimWebhookEvent(eventId, eventType);
  if (!claim.claimed) {
    logInfo(`Duplicate Stripe webhook event ${eventId}`);
    return c.json({ received: true, duplicate: true });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const order_id = paymentIntent.metadata?.order_id;

        if (order_id) {
          // BUG-002 FIX: Fetch existing order to merge metadata (preserve tax breakdown)
          const [existingOrder] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, order_id))
            .limit(1);

          const completed = await finalizeCapturedPayment(order_id, {
            stripe_payment_intent_id: paymentIntent.id,
            stripe_payment_status: paymentIntent.status,
            payment_provider: 'stripe',
            paid_at: new Date().toISOString(),
          });

          if (!completed) {
            logError(`Payment review required for released order ${order_id}`);
          } else {
            logInfo(`Payment succeeded for order ${order_id}`);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const order_id = paymentIntent.metadata?.order_id;

        if (order_id) {
          // BUG-002 FIX: Merge metadata for failed payments too
          const [existingOrder] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, order_id))
            .limit(1);

          await db
            .update(orders)
            .set({
              payment_status: 'failed',
              metadata: {
                ...((existingOrder?.metadata as Record<string, any>) || {}),
                stripe_payment_intent_id: paymentIntent.id,
                stripe_payment_status: paymentIntent.status,
                payment_failed_at: new Date().toISOString(),
                payment_failure_message:
                  paymentIntent.last_payment_error?.message,
              },
            })
            .where(eq(orders.id, order_id));

          await releaseInventoryReservation(order_id, 'stripe_payment_failed');
          logInfo(`Payment failed for order ${order_id}`);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          // Find order by payment intent ID (jsonb column)
          const order = await db
            .select()
            .from(orders)
            .where(
              sql`${orders.metadata}->>'stripe_payment_intent_id' = ${paymentIntentId}`
            )
            .limit(1);

          if (order.length > 0) {
            await db
              .update(orders)
              .set({
                payment_status: 'refunded',
                metadata: {
                  ...(order[0].metadata as Record<string, any>),
                  stripe_refund_id: charge.refunds?.data[0]?.id,
                  refunded_at: new Date().toISOString(),
                },
              })
              .where(eq(orders.id, order[0].id));

            logInfo(`Order ${order[0].id} refunded`);
          }
        }
        break;
      }

      default:
        logInfo(`Unhandled event type: ${event.type}`);
    }

    // 🔒 FIX-007: Mark webhook event as processed
    await db
      .update(webhook_events)
      .set({
        processed_at: new Date(),
        status: 'processed',
      })
      .where(eq(webhook_events.event_id, eventId));

    return c.json({ received: true });
  } catch (error: any) {
    logError('Webhook processing error', error);
    // 🔒 FIX-007: Mark as failed so Stripe can retry
    await db
      .update(webhook_events)
      .set({ status: 'failed' })
      .where(eq(webhook_events.event_id, eventId));
    return c.json({ error: error.message }, 500);
  }
});

export default paymentRouter;
