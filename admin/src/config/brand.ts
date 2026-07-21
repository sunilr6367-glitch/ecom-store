const storeName = process.env.NEXT_PUBLIC_STORE_NAME?.trim() || 'Kvastram Store';

export const adminBrandConfig = {
  storeName,
  adminTitle:
    process.env.NEXT_PUBLIC_ADMIN_TITLE?.trim() || `${storeName} Admin`,
} as const;

