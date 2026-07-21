export interface StoreRegion {
  id: string;
  name: string;
  currency_code: string;
  tax_rate: number;
  countries?: string[] | null;
  metadata?: {
    market_key?: string;
    checkout_enabled?: boolean;
    catchall?: boolean;
  } | null;
}

const EUROPE_COUNTRY_CODES = new Set([
  'DE',
  'FR',
  'PL',
  'IT',
  'ES',
  'NL',
  'BE',
  'AT',
  'SE',
  'DK',
  'FI',
  'NO',
]);

export function getSelectableRegions(regions: StoreRegion[]): StoreRegion[] {
  const hasCheckoutMarkets = regions.some(
    (region) => region.metadata?.checkout_enabled === true
  );

  return hasCheckoutMarkets
    ? regions.filter((region) => region.metadata?.checkout_enabled === true)
    : regions;
}

export function resolveRegionForCountry(
  regions: StoreRegion[],
  countryCode: string
): StoreRegion | null {
  const normalizedCode = countryCode.trim().toUpperCase();
  if (!normalizedCode) return null;

  const selectableRegions = getSelectableRegions(regions);
  const exactMatch = selectableRegions.find((region) =>
    region.countries?.some((code) => code.toUpperCase() === normalizedCode)
  );
  if (exactMatch) return exactMatch;

  const marketMatch = selectableRegions.find((region) => {
    const marketKey = region.metadata?.market_key?.toLowerCase();
    const name = region.name.toLowerCase();

    if (normalizedCode === 'IN') return marketKey === 'india' || name === 'india';
    if (normalizedCode === 'US') {
      return marketKey === 'us' || name === 'united states';
    }
    if (normalizedCode === 'GB') {
      return marketKey === 'uk' || name === 'united kingdom';
    }
    if (EUROPE_COUNTRY_CODES.has(normalizedCode)) {
      return (
        marketKey === 'europe' || name === 'europe' || name === 'european union'
      );
    }
    return false;
  });
  if (marketMatch) return marketMatch;

  return (
    selectableRegions.find(
      (region) =>
        region.metadata?.catchall === true ||
        region.metadata?.market_key === 'rest-of-world' ||
        region.name.toLowerCase() === 'rest of world'
    ) || null
  );
}
