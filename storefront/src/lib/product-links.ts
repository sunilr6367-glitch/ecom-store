const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PRODUCT_ID_PATTERN = /^prod_[a-z0-9_-]+$/i;

export function getCanonicalProductHandle(
  handle: string | null | undefined
): string | undefined {
  if (typeof handle !== 'string') return undefined;

  const trimmed = handle.trim();
  if (!trimmed) return undefined;
  if (UUID_PATTERN.test(trimmed) || PRODUCT_ID_PATTERN.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}
