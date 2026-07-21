const CLOUDINARY_HOSTNAME = 'res.cloudinary.com';

export function isCloudinaryUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === CLOUDINARY_HOSTNAME;
  } catch {
    return false;
  }
}

export function cloudinaryUrlOrNull(value: unknown): string | null {
  return isCloudinaryUrl(value) ? value : null;
}

function forceSeoSafeImageExtension(src: string): string {
  return src.replace(/\.(heic|heif)(?=$|[?#])/i, '.jpg');
}

/**
 * Inject f_auto,q_auto into a Cloudinary URL so the CDN converts HEIC/HEIF
 * and any other format to the best format the browser supports.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function optimizeCloudinaryUrl(src: string): string {
  if (!isCloudinaryUrl(src)) return src;
  const seoSafeSrc = forceSeoSafeImageExtension(src);
  if (seoSafeSrc.includes('f_auto') || seoSafeSrc.includes('q_auto')) return seoSafeSrc;
  return seoSafeSrc.replace('/upload/', '/upload/f_auto,q_auto/');
}

export function cloudinaryImageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (!isCloudinaryUrl(src)) return src;
  const seoSafeSrc = forceSeoSafeImageExtension(src);
  const transformations = `f_auto,q_auto,w_${width},c_limit`;
  return seoSafeSrc.replace('/upload/', `/upload/${transformations}/`);
}
