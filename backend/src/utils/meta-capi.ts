import { createHash } from 'crypto';

function sha256(val?: string | null): string | undefined {
  if (!val) return undefined;
  return createHash('sha256')
    .update(val.trim().toLowerCase())
    .digest('hex');
}

export async function trackMetaServerEvent(
  eventName: 'AddToCart' | 'InitiateCheckout' | 'Purchase',
  eventId: string,
  userData: {
    email?: string | null;
    phone?: string | null;
    clientIp?: string | null;
    clientUserAgent?: string | null;
  },
  customData?: {
    value?: number;
    currency?: string;
    orderId?: string;
  }
) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Meta CAPI DEV] Skipped sending event ${eventName} (event_id: ${eventId}) - Credentials missing.`);
    }
    return;
  }

  // Hash identifiers to comply with privacy policies
  const hashedEmail = sha256(userData.email);
  const hashedPhone = sha256(userData.phone);

  const eventPayload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        user_data: {
          em: hashedEmail ? [hashedEmail] : undefined,
          ph: hashedPhone ? [hashedPhone] : undefined,
          client_ip_address: userData.clientIp || undefined,
          client_user_agent: userData.clientUserAgent || undefined,
        },
        custom_data: customData ? {
          value: customData.value,
          currency: customData.currency || 'INR',
          order_id: customData.orderId || undefined,
        } : undefined,
        action_source: 'website',
      },
    ],
  };

  try {
    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    const data: any = await response.json();
    if (data.error) {
      console.error('[Meta CAPI Error] Graph API returned error:', data.error);
    } else {
      console.log(`[Meta CAPI] Event ${eventName} successfully tracked (event_id: ${eventId}).`);
    }
  } catch (error) {
    console.error('[Meta CAPI Error] Failed to dispatch server event:', error);
  }
}
