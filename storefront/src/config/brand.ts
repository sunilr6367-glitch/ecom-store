const publicValue = (value: string | undefined, fallback: string) =>
  value?.trim() || fallback;

export const brandConfig = {
  name: publicValue(process.env.NEXT_PUBLIC_STORE_NAME, 'Kvastram Store'),
  legalName: publicValue(
    process.env.NEXT_PUBLIC_STORE_LEGAL_NAME,
    'Kvastram Store',
  ),
  siteUrl: publicValue(
    process.env.NEXT_PUBLIC_SITE_URL,
    'http://localhost:3100',
  ).replace(/\/$/, ''),
  supportEmail: publicValue(
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    'support@example.com',
  ),
  wholesaleEmail: publicValue(
    process.env.NEXT_PUBLIC_WHOLESALE_EMAIL,
    'wholesale@example.com',
  ),
  supportPhone: publicValue(
    process.env.NEXT_PUBLIC_SUPPORT_PHONE,
    '+00 00000 00000',
  ),
  supportHours: publicValue(
    process.env.NEXT_PUBLIC_SUPPORT_HOURS,
    'Monday-Friday, 9 AM - 6 PM',
  ),
  instagramUrl: publicValue(
    process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    'https://www.instagram.com/',
  ),
  whatsappUrl: publicValue(
    process.env.NEXT_PUBLIC_WHATSAPP_URL,
    'https://wa.me/',
  ),
  defaultCurrency: publicValue(
    process.env.NEXT_PUBLIC_DEFAULT_CURRENCY,
    'USD',
  ),
  paymentLogoPath: publicValue(
    process.env.NEXT_PUBLIC_PAYMENT_LOGO_PATH,
    '/logo.png',
  ),
  location: publicValue(
    process.env.NEXT_PUBLIC_STORE_LOCATION,
    'Online store',
  ),
  addressLines: publicValue(
    process.env.NEXT_PUBLIC_STORE_ADDRESS,
    'Address available on request',
  )
    .split('|')
    .map((line) => line.trim())
    .filter(Boolean),
} as const;
