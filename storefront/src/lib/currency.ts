// Centralized currency formatting utilities

const DEFAULT_LOCALE = 'en-US';

// Local currency detection & conversion

// Browser locale → ISO 4217 currency code
const LOCALE_CURRENCY_MAP: Record<string, string> = {
  // South Asia
  'hi': 'INR', 'hi-IN': 'INR', 'en-IN': 'INR', 'bn-BD': 'BDT', 'bn-IN': 'INR',
  'ur': 'PKR', 'ur-PK': 'PKR', 'si': 'LKR', 'si-LK': 'LKR', 'ne': 'NPR', 'ne-NP': 'NPR',
  // North America
  'en-US': 'USD', 'es-US': 'USD',
  'en-CA': 'CAD', 'fr-CA': 'CAD',
  'es-MX': 'MXN',
  // Europe
  'en-GB': 'GBP',
  'de': 'EUR', 'de-DE': 'EUR', 'de-AT': 'EUR',
  'fr': 'EUR', 'fr-FR': 'EUR', 'fr-BE': 'EUR', 'fr-LU': 'EUR',
  'it': 'EUR', 'it-IT': 'EUR',
  'es': 'EUR', 'es-ES': 'EUR',
  'nl': 'EUR', 'nl-NL': 'EUR', 'nl-BE': 'EUR',
  'pt-PT': 'EUR', 'el': 'EUR', 'fi': 'EUR', 'et': 'EUR', 'lv': 'EUR', 'lt': 'EUR',
  'sk': 'EUR', 'sl': 'EUR', 'ga': 'EUR', 'mt': 'EUR',
  'de-CH': 'CHF', 'fr-CH': 'CHF', 'it-CH': 'CHF',
  'sv': 'SEK', 'sv-SE': 'SEK',
  'nb': 'NOK', 'nb-NO': 'NOK', 'nn': 'NOK', 'nn-NO': 'NOK',
  'da': 'DKK', 'da-DK': 'DKK',
  'pl': 'PLN', 'pl-PL': 'PLN',
  'cs': 'CZK', 'cs-CZ': 'CZK',
  'hu': 'HUF', 'hu-HU': 'HUF',
  'ro': 'RON', 'ro-RO': 'RON',
  // Middle East
  'ar-AE': 'AED', 'ar-SA': 'SAR', 'ar-KW': 'KWD', 'ar-QA': 'QAR',
  'ar-BH': 'BHD', 'ar-OM': 'OMR', 'ar-EG': 'EGP',
  'he': 'ILS', 'he-IL': 'ILS',
  'tr': 'TRY', 'tr-TR': 'TRY',
  // Asia Pacific
  'ja': 'JPY', 'ja-JP': 'JPY',
  'zh': 'CNY', 'zh-CN': 'CNY', 'zh-TW': 'TWD', 'zh-HK': 'HKD',
  'ko': 'KRW', 'ko-KR': 'KRW',
  'en-AU': 'AUD', 'en-NZ': 'NZD',
  'en-SG': 'SGD', 'zh-SG': 'SGD',
  'ms': 'MYR', 'ms-MY': 'MYR',
  'th': 'THB', 'th-TH': 'THB',
  'id': 'IDR', 'id-ID': 'IDR',
  'fil': 'PHP', 'tl': 'PHP',
  'vi': 'VND', 'vi-VN': 'VND',
  // Latin America
  'pt-BR': 'BRL',
  'es-AR': 'ARS', 'es-CL': 'CLP', 'es-CO': 'COP', 'es-PE': 'PEN',
  // Africa
  'en-ZA': 'ZAR', 'en-NG': 'NGN', 'en-KE': 'KES', 'en-GH': 'GHS',
  'ar-MA': 'MAD',
};

const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND', 'IDR', 'TWD', 'CLP', 'GNF', 'UGX']);
const CURRENCY_LOCALE_MAP: Record<string, string> = {
  INR: 'en-IN',  USD: 'en-US',  GBP: 'en-GB',  EUR: 'de-DE',
  JPY: 'ja-JP',  AUD: 'en-AU',  CAD: 'en-CA',  SGD: 'en-SG',
  AED: 'ar-AE',  SAR: 'ar-SA',  KWD: 'ar-KW',  QAR: 'ar-QA',
  BHD: 'ar-BH',  OMR: 'ar-OM',  ILS: 'he-IL',  TRY: 'tr-TR',
  CNY: 'zh-CN',  TWD: 'zh-TW',  HKD: 'zh-HK',  KRW: 'ko-KR',
  NZD: 'en-NZ',  MYR: 'ms-MY',  THB: 'th-TH',  IDR: 'id-ID',
  PHP: 'fil-PH', VND: 'vi-VN',  BDT: 'bn-BD',  PKR: 'ur-PK',
  LKR: 'si-LK',  NPR: 'ne-NP',
  CHF: 'de-CH',  SEK: 'sv-SE',  NOK: 'nb-NO',  DKK: 'da-DK',
  PLN: 'pl-PL',  CZK: 'cs-CZ',  HUF: 'hu-HU',  RON: 'ro-RO',
  BRL: 'pt-BR',  MXN: 'es-MX',  ARS: 'es-AR',  CLP: 'es-CL',
  COP: 'es-CO',  PEN: 'es-PE',
  ZAR: 'en-ZA',  NGN: 'en-NG',  KES: 'en-KE',  GHS: 'en-GH',
  EGP: 'ar-EG',
};

/**
 * Detect the user's preferred currency from browser locale.
 * Store sells to international (Western) buyers — defaults to USD.
 * Only falls back to INR for explicitly Indian locales (hi, en-IN).
 */
export function detectUserCurrency(): string {
  if (typeof navigator === 'undefined') return 'USD';
  const languages = navigator.languages?.length ? [...navigator.languages] : [navigator.language || 'en-US'];

  for (const lang of languages) {
    if (LOCALE_CURRENCY_MAP[lang]) return LOCALE_CURRENCY_MAP[lang];

    const base = lang.split('-')[0];
    if (base !== 'en' && LOCALE_CURRENCY_MAP[base]) return LOCALE_CURRENCY_MAP[base];
  }

  return 'USD';
}

/**
 * Convert INR paise (stored in DB, e.g. 199900 = ₹1999) to a target currency amount.
 * @param inrPaise - raw DB amount in paise
 * @param targetCurrency - ISO 4217 code e.g. 'USD'
 * @param rates - rate map from /api/exchange-rates (base = INR, e.g. { USD: 0.012 })
 */
export function convertFromINR(
  inrPaise: number,
  targetCurrency: string,
  rates: Record<string, number>
): number {
  const inrAmount = inrPaise / 100;
  if (targetCurrency === 'INR') return inrAmount;
  const rate = rates[targetCurrency.toUpperCase()];
  if (!rate) return inrAmount;
  return inrAmount * rate;
}

/** One-shot: convert INR paise → formatted local currency string. */
export function formatPriceFromINR(
  inrPaise: number,
  targetCurrency: string,
  rates: Record<string, number>,
  locale?: string
): string {
  const converted = convertFromINR(inrPaise, targetCurrency, rates);
  const resolvedLocale =
    locale ?? getCurrencyLocale(targetCurrency) ?? (typeof navigator !== 'undefined' ? navigator.language : 'en-IN');
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(targetCurrency.toUpperCase());
  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: targetCurrency.toUpperCase(),
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(converted);
  } catch {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(inrPaise / 100);
  }
}

export function getCurrencyLocale(currency: string): string {
  return CURRENCY_LOCALE_MAP[currency.toUpperCase()] || 'en-IN';
}

export function formatMoney(
  amount: number,
  currency: string,
  locale?: string
): string {
  const normalizedCurrency = currency.toUpperCase();
  const resolvedLocale = locale ?? getCurrencyLocale(normalizedCurrency);
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency);

  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  } catch {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount / 100);
  }
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    const normalizedCurrency = currency.toUpperCase();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
    }).format(amount / 100);
  } catch {
    // Fallback for unsupported currencies - use known-good locale
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  }
}

export function formatCurrencyRaw(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    const normalizedCurrency = currency.toUpperCase();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
    }).format(amount);
  } catch {
    // Fallback for unsupported currencies - use known-good locale
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    CNY: 'CN¥',
    KRW: '₩',
  };
  return symbols[currency.toUpperCase()] || currency.toUpperCase();
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate: number
): number {
  // Validate that we have a meaningful rate for different currencies
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('Invalid conversion rate: must be a positive number');
  }
  return Math.round(amount * rate);
}
