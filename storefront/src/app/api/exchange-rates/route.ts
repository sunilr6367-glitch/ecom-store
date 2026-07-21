import { NextResponse } from 'next/server';

// Cached exchange rates endpoint
// Fetches from open.er-api.com (free, no key needed) and caches for 6 hours

export const revalidate = 21600; // 6 hours

let hasLoggedFallbackReason = false;

interface ExchangeRateResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_unix: number;
}

const FALLBACK_RATES = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  JPY: 1.79,
  AUD: 0.018,
  CAD: 0.016,
  SGD: 0.016,
  AED: 0.044,
  CNY: 0.086,
  KRW: 16.2,
  CHF: 0.011,
  SEK: 0.12,
  NOK: 0.13,
  DKK: 0.082,
  BRL: 0.067,
  MXN: 0.23,
  ZAR: 0.22,
};

function fallbackResponse() {
  return NextResponse.json(
    {
      base: 'INR',
      rates: FALLBACK_RATES,
      updated_at: Math.floor(Date.now() / 1000),
      fallback: true,
    },
    { status: 200 }
  );
}

function logFallbackReason(reason: string, error?: unknown) {
  if (process.env.NODE_ENV !== 'development' || hasLoggedFallbackReason) {
    return;
  }

  hasLoggedFallbackReason = true;

  if (error) {
    console.warn(`Exchange rate route is using fallback rates: ${reason}`, error);
    return;
  }

  console.warn(`Exchange rate route is using fallback rates: ${reason}`);
}

function shouldPreferFallbackRates() {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return 'production build';
  }

  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const internalApiUrl = process.env.INTERNAL_API_URL || '';
  const localApiPattern = /https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?/i;

  if (localApiPattern.test(publicApiUrl) || localApiPattern.test(internalApiUrl)) {
    return 'local mock API environment';
  }

  return null;
}

export async function GET() {
  const fallbackReason = shouldPreferFallbackRates();

  if (fallbackReason) {
    logFallbackReason(fallbackReason);
    return fallbackResponse();
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/INR', {
      next: { revalidate: 21600 },
    });

    if (!res.ok) {
      throw new Error(`Exchange rate API returned ${res.status}`);
    }

    const data: ExchangeRateResponse = await res.json();

    return NextResponse.json(
      {
        base: 'INR',
        rates: data.rates,
        updated_at: data.time_last_update_unix,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
        },
      }
    );
  } catch (err) {
    logFallbackReason('live provider fetch failed', err);
    // Fallback rates (approximate) so the site never fully breaks
    return fallbackResponse();
  }
}
