import { Context, Next } from 'hono';

/**
 * OPT-004: Request timeout middleware
 * Prevents long-running requests from blocking the server.
 * Default: 30 seconds for normal requests, 120 seconds for uploads/webhooks.
 *
 * Uses Promise.race to enforce a timeout. If the route handler doesn't
 * complete within the configured time, a 408 Request Timeout is returned.
 */
export function requestTimeout(timeoutMs: number = 30000) {
  return async (c: Context, next: Next) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const controller = new AbortController();

    // Pass abort signal via context for downstream handlers to read
    c.set('abortSignal', controller.signal);

    const timeoutPromise = new Promise<void>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('REQUEST_TIMEOUT'));
      }, timeoutMs);
    });

    try {
      await Promise.race([
        next().catch((err) => {
          // Handle any errors from next() to prevent unhandled rejections
          console.error('Request handler error:', err);
          throw err;
        }),
        timeoutPromise,
      ]);
    } catch (error: any) {
      if (error?.message === 'REQUEST_TIMEOUT') {
        return c.json({ error: 'Request timeout. Please try again.' }, 408);
      }
      throw error; // Re-throw non-timeout errors
    } finally {
      clearTimeout(timeoutId!);
    }
  };
}

// Pre-configured timeout middleware
export const defaultTimeout = requestTimeout(30000); // 30s for normal routes
export const uploadTimeout = requestTimeout(60000); // 60s for file uploads
export const webhookTimeout = requestTimeout(120000); // 120s for webhook processing
