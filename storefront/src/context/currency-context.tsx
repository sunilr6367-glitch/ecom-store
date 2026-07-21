'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { formatPriceFromINR, getCurrencyLocale } from '@/lib/currency';
import { useShop } from '@/context/shop-context';

interface CurrencyContextValue {
  /** Detected currency code e.g. 'USD', 'GBP', 'INR' */
  currency: string;
  /** Exchange rates from INR base e.g. { USD: 0.012, EUR: 0.011 } */
  rates: Record<string, number>;
  /** Whether rates are still loading */
  loading: boolean;
  /**
   * Format a price stored as INR paise (÷100 = ₹) into the user's local currency.
   * Falls back to showing INR if rates not yet loaded.
   */
  formatPrice: (inrPaise: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

// Fallback rates so UI never shows broken prices while fetching
const FALLBACK_RATES: Record<string, number> = {
  INR: 1,     USD: 0.012, EUR: 0.011, GBP: 0.0095,
  JPY: 1.79,  AUD: 0.018, CAD: 0.016, SGD: 0.016,
  AED: 0.044, SAR: 0.045, KWD: 0.0037, QAR: 0.044,
  BHD: 0.0045, OMR: 0.0046, ILS: 0.044, TRY: 0.39,
  CNY: 0.086, TWD: 0.39,  HKD: 0.094, KRW: 16.2,
  NZD: 0.02,  MYR: 0.056, THB: 0.44,  IDR: 196,
  PHP: 0.70,  VND: 305,   BDT: 1.32,  PKR: 3.34,
  LKR: 3.68,  NPR: 1.6,
  CHF: 0.011, SEK: 0.12,  NOK: 0.13,  DKK: 0.082,
  PLN: 0.049, CZK: 0.28,  HUF: 4.4,   RON: 0.056,
  BRL: 0.067, MXN: 0.23,  ARS: 12.1,  CLP: 11.4,
  COP: 50.6,  PEN: 0.046,
  ZAR: 0.22,  NGN: 19.8,  KES: 1.56,  GHS: 0.18,
  EGP: 0.59,
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { currentRegion } = useShop();
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [loading, setLoading] = useState(true);

  const currency = currentRegion?.currency_code?.toUpperCase() || 'INR';
  const locale = useMemo(() => {
    // getCurrencyLocale covers all currencies; falls back to en-IN
    return getCurrencyLocale(currency);
  }, [currency]);

  useEffect(() => {
    // Fetch live rates from our cached API route
    fetch('/api/exchange-rates')
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates) setRates(data.rates);
      })
      .catch(() => {
        // Keep fallback rates — never throw
      })
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = useCallback(
    (inrPaise: number) => formatPriceFromINR(inrPaise, currency, rates, locale),
    [currency, rates, locale]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({ currency, rates, loading, formatPrice }),
    [currency, rates, loading, formatPrice]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside <CurrencyProvider>');
  return ctx;
}
