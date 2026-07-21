export interface StorefrontNavItem {
  label: string;
  href: string;
  hasMega?: boolean;
}

export interface StorefrontNavLink {
  label: string;
  href: string;
  isNew?: boolean;
}

export interface StorefrontNavGroup {
  label: string;
  items: StorefrontNavLink[];
}

export const STOREFRONT_NAV_ITEMS: StorefrontNavItem[] = [
  { label: 'Shop', href: '/products', hasMega: true },
  { label: 'Categories', href: '/categories', hasMega: true },
  { label: 'Collections', href: '/collections', hasMega: true },
  { label: 'Sale', href: '/sale' },
  { label: 'About', href: '/about' },
];

export const CATEGORY_QUICK_LINKS: StorefrontNavLink[] = [
  { label: 'New Kantha Short Kimono', href: '/categories/new-kantha-short-kimono' },
  { label: 'Vintage Kantha Jacket', href: '/categories/vintage-kantha-jacket' },
  { label: 'Velvet Suzani Jacket', href: '/categories/velvet-suzani-jacket' },
  { label: 'Velvet Long Kimono', href: '/categories/velvet-long-kimono' },
  { label: 'Tote Bags', href: '/categories/tote-bags' },
  { label: 'Gown & Dress', href: '/categories/gown-dress' },
];

export const MEGA_FALLBACK_CATEGORY_GROUPS: StorefrontNavGroup[] = [
  {
    label: 'Jackets & Kimonos',
    items: [
      { label: 'New Kantha Short Kimono', href: '/categories/new-kantha-short-kimono' },
      { label: 'Vintage Kantha Jacket', href: '/categories/vintage-kantha-jacket' },
      { label: 'Velvet Suzani Jacket', href: '/categories/velvet-suzani-jacket' },
      { label: 'Velvet Long Kimono', href: '/categories/velvet-long-kimono' },
    ],
  },
];

export const MEGA_FALLBACK_SECONDARY_GROUPS: StorefrontNavGroup[] = [
  {
    label: 'Apparel & Accessories',
    items: [
      { label: 'Gown & Dress', href: '/categories/gown-dress' },
      { label: 'Tote Bags', href: '/categories/tote-bags' },
    ],
  },
];

export const MEGA_FALLBACK_COLLECTION_GROUPS: StorefrontNavGroup[] = [
  {
    label: 'Collections',
    items: [
      { label: 'Best Sellers', href: '/collections/best-sellers' },
      { label: 'New Arrivals', href: '/collections/new-arrivals' },
      { label: 'Trending', href: '/collections/trending' },
      { label: 'Sale', href: '/collections/sale' },
      { label: 'Editors Picks', href: '/collections/editors-picks' },
      { label: 'Essentials', href: '/collections/essentials' },
    ],
  },
];
