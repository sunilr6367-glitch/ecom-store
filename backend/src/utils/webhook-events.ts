import { and, eq } from 'drizzle-orm';

import { db } from '../db';
import { webhook_events } from '../db/schema';

export async function claimWebhookEvent(eventId: string, eventType: string) {
  try {
    await db.insert(webhook_events).values({
      event_id: eventId,
      event_type: eventType,
      status: 'processing',
    });
    return { claimed: true, duplicate: false };
  } catch (error: any) {
    if (error?.code !== '23505') throw error;

    const [existing] = await db
      .select({ status: webhook_events.status })
      .from(webhook_events)
      .where(eq(webhook_events.event_id, eventId))
      .limit(1);

    if (existing?.status !== 'failed') {
      return { claimed: false, duplicate: true };
    }

    const [reclaimed] = await db
      .update(webhook_events)
      .set({
        status: 'processing',
        processed_at: null,
      })
      .where(
        and(
          eq(webhook_events.event_id, eventId),
          eq(webhook_events.status, 'failed')
        )
      )
      .returning({ event_id: webhook_events.event_id });

    return { claimed: Boolean(reclaimed), duplicate: !reclaimed };
  }
}
