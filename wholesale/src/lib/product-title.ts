export function getProductDisplayTitle(title: string | undefined | null): string {
  if (!title) return '';
  const cleaned = title
    .replace(/\s+/g, ' ')
    .replace(/\b(Odhvica|Handmade|Handcrafted|Artisan|Luxury)\b/gi, '')
    .trim();
  const displayTitle = cleaned.split(/\s+[|/-]\s+/)[0]?.trim();
  return displayTitle || title.trim();
}
