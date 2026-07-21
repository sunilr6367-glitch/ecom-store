const value = (name: string, fallback: string) =>
  process.env[name]?.trim() || fallback;

export const brandConfig = {
  name: value('STORE_NAME', 'Kvastram Store'),
  legalName: value('STORE_LEGAL_NAME', 'Kvastram Store'),
  storefrontUrl: value('STOREFRONT_URL', 'http://localhost:3100').replace(
    /\/$/,
    '',
  ),
  adminUrl: value('ADMIN_URL', 'http://localhost:3101').replace(/\/$/, ''),
  supportEmail: value('SUPPORT_EMAIL', 'support@example.com'),
  wholesaleEmail: value('WHOLESALE_EMAIL', 'wholesale@example.com'),
  senderName: value('EMAIL_FROM_NAME', value('STORE_NAME', 'Kvastram Store')),
  assetFolder: value('ASSET_FOLDER', 'kvastram-store'),
} as const;
