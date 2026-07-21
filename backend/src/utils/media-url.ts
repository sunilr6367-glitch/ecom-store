const CLOUDINARY_HOSTNAME = 'res.cloudinary.com';

export function isCloudinaryUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  if (value.startsWith('/uploads/') || value.startsWith('http://localhost:4000/uploads/')) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function cloudinaryUrlOrNull(value: unknown): string | null {
  return isCloudinaryUrl(value) ? value : null;
}

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
