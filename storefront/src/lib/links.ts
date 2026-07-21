export function isStorefrontHref(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  const href = value.trim();
  if (href.startsWith('/') && !href.startsWith('//')) {
    return true;
  }

  try {
    const url = new URL(href);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function storefrontHrefOrNull(value: unknown): string | null {
  return isStorefrontHref(value) ? value.trim() : null;
}
