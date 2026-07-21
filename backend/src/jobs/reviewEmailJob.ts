import { and, asc, inArray, lte, or, sql } from 'drizzle-orm';

import { db } from '../db/client';
import { line_items, orders } from '../db/schema';
import { emailService } from '../services/email-service';

type MetadataRecord = Record<string, unknown>;

function isDirectJobRun() {
  return (process.argv[1] || '').replace(/\\/g, '/').includes('/reviewEmailJob');
}

function toMetadataRecord(value: unknown): MetadataRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as MetadataRecord) }
    : {};
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getStorefrontUrl() {
  return (
    process.env.STOREFRONT_URL ||
    process.env.FRONTEND_URL ||
    'https://odhvica.com'
  ).replace(/\/$/, '');
}

function getReviewDelayDays() {
  const parsed = Number(process.env.REVIEW_REQUEST_DELAY_DAYS || '7');
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 7;
}

export async function sendReviewRequestEmails() {
  const batchSize = Number(process.env.REVIEW_REQUEST_BATCH_SIZE || '50');
  const cutoff = new Date(Date.now() - getReviewDelayDays() * 24 * 60 * 60 * 1000);

  const eligibleOrders = await db
    .select({
      id: orders.id,
      display_id: orders.display_id,
      email: orders.email,
      status: orders.status,
      fulfillment_status: orders.fulfillment_status,
      metadata: orders.metadata,
      updated_at: orders.updated_at,
    })
    .from(orders)
    .where(
      and(
        or(
          sql`${orders.status} in ('delivered', 'completed')`,
          sql`${orders.fulfillment_status} in ('fulfilled', 'delivered')`
        ),
        lte(orders.updated_at, cutoff),
        sql`coalesce(${orders.metadata}->>'review_request_sent_at', '') = ''`,
        sql`coalesce(${orders.email}, '') <> ''`
      )
    )
    .orderBy(asc(orders.updated_at))
    .limit(Number.isFinite(batchSize) && batchSize > 0 ? batchSize : 50);

  if (eligibleOrders.length === 0) {
    return { sent: 0, failed: 0, skipped: true, reason: 'No eligible delivered orders' };
  }

  const orderIds = eligibleOrders.map((order) => order.id);
  const purchasedItems = await db
    .select({
      order_id: line_items.order_id,
      title: line_items.title,
    })
    .from(line_items)
    .where(inArray(line_items.order_id, orderIds));

  const itemMap = new Map<string, string[]>();
  for (const item of purchasedItems) {
    const items = itemMap.get(item.order_id) || [];
    if (item.title) items.push(item.title);
    itemMap.set(item.order_id, items);
  }

  let sent = 0;
  let failed = 0;
  const now = new Date().toISOString();
  const storefrontUrl = getStorefrontUrl();

  for (const order of eligibleOrders) {
    const orderNumber = order.display_id ? `#${order.display_id}` : order.id.slice(0, 8);
    const itemNames = (itemMap.get(order.id) || []).slice(0, 3);
    const productLine =
      itemNames.length > 0
        ? `for ${itemNames.map(escapeHtml).join(', ')}`
        : 'for your recent Odhvica purchase';
    const reviewUrl = `${storefrontUrl}/account/orders`;
    const subject = `How was your Odhvica order ${orderNumber}?`;
    const text = [
      `Thank you for shopping with Odhvica.`,
      `We would love your review ${productLine.replace(/&amp;/g, '&')}.`,
      `You can leave feedback from your orders page: ${reviewUrl}`,
    ].join('\n\n');
    const html = `
      <div style="font-family:Arial,sans-serif;color:#333;line-height:1.5">
        <h1 style="font-size:20px;margin:0 0 16px">How was your Odhvica order ${escapeHtml(orderNumber)}?</h1>
        <p>Thank you for shopping with Odhvica. We would love your review ${productLine}.</p>
        <p><a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:#1c1917;color:#fff;padding:12px 18px;text-decoration:none">Leave a review</a></p>
        <p style="color:#57534e;font-size:13px">Your feedback helps other customers choose handmade pieces with confidence.</p>
      </div>
    `;

    const result = await emailService.sendEmail({
      to: order.email,
      subject,
      text,
      html,
    });

    const metadata = toMetadataRecord(order.metadata);
    const reviewRequests = Array.isArray(metadata.review_requests)
      ? [...metadata.review_requests]
      : [];

    if (result !== false) {
      sent += 1;
      reviewRequests.push({ sent_at: now, status: 'sent', template: 'review_request' });
      await db
        .update(orders)
        .set({
          metadata: {
            ...metadata,
            review_request_sent_at: now,
            review_requests: reviewRequests,
          },
          updated_at: new Date(),
        })
        .where(sql`${orders.id} = ${order.id}`);
    } else {
      failed += 1;
      reviewRequests.push({ attempted_at: now, status: 'failed', template: 'review_request' });
      await db
        .update(orders)
        .set({
          metadata: {
            ...metadata,
            review_request_last_error_at: now,
            review_requests: reviewRequests,
          },
          updated_at: new Date(),
        })
        .where(sql`${orders.id} = ${order.id}`);
    }
  }

  return { sent, failed, skipped: false };
}

if (require.main === module && isDirectJobRun()) {
  sendReviewRequestEmails()
    .then((result) => {
      console.log(result);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
