import { config } from '../config';

const REVALIDATE_TIMEOUT_MS = 5000;

interface RevalidatePayload {
  productId?: string;
  handle?: string;
  paths?: string[];
  tags?: string[];
}

export async function triggerStorefrontRevalidation(payload: RevalidatePayload = {}) {
  const storefrontUrl = config.storefront.url;
  const secret = config.storefront.revalidateSecret;

  if (!storefrontUrl || !secret) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REVALIDATE_TIMEOUT_MS);

  try {
    const response = await fetch(new URL('/api/revalidate', storefrontUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret,
        productId: payload.productId,
        handle: payload.handle,
        paths: payload.paths,
        tags: payload.tags,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[StorefrontRevalidate] Request failed:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[StorefrontRevalidate] Request error:', error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
