import type { LucideIcon } from 'lucide-react';
import {
  BarChart2,
  ClipboardList,
  Clapperboard,
  FileText,
  FolderKanban,
  Globe,
  Landmark,
  Layers,
  LayoutDashboard,
  ListTree,
  Megaphone,
  Package,
  RotateCcw,
  Settings,
  ShoppingBag,
  Images,
  Star,
  Tag,
  Truck,
  Users,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: 'pendingOrders';
  description?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export type DashboardMode = 'retail' | 'wholesale';

export const retailNavGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Store snapshot',
      },
      {
        label: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart2,
        description: 'Revenue and trends',
      },
    ],
  },
  {
    label: 'Sales',
    items: [
      {
        label: 'Orders',
        href: '/dashboard/orders',
        icon: ShoppingBag,
        badge: 'pendingOrders',
        description: 'Orders and shipping',
      },
      {
        label: 'Customers',
        href: '/dashboard/customers',
        icon: Users,
        description: 'Profiles and history',
      },
      {
        label: 'Returns',
        href: '/dashboard/returns',
        icon: RotateCcw,
        description: 'Return workflows',
      },
    ],
  },
  {
    label: 'Catalog',
    items: [
      {
        label: 'Products',
        href: '/dashboard/products',
        icon: Package,
        description: 'Listings and inventory',
      },
      {
        label: 'Categories',
        href: '/dashboard/categories',
        icon: ListTree,
        description: 'Taxonomy and menus',
      },
      {
        label: 'Collections',
        href: '/dashboard/collections',
        icon: FolderKanban,
        description: 'Curated product groups',
      },
      {
        label: 'Tags',
        href: '/dashboard/tags',
        icon: Tag,
        description: 'Product filters and labels',
      },
      {
        label: 'Reviews',
        href: '/dashboard/reviews',
        icon: Star,
        description: 'Moderate social proof',
      },
      {
        label: 'Regions',
        href: '/dashboard/regions',
        icon: Globe,
        description: 'Markets and currencies',
      },
    ],
  },
  {
    label: 'Storefront Content',
    items: [
      {
        label: 'Category Circles',
        href: '/dashboard/content/category-circles',
        icon: LayoutDashboard,
        description: 'Mobile hero circle shortcuts',
      },
      {
        label: 'Trending Reels',
        href: '/dashboard/content/trending-reels',
        icon: Clapperboard,
        description: 'Short-form media',
      },
      {
        label: 'Reel Collections',
        href: '/dashboard/content/reel-collections',
        icon: Layers,
        description: 'Reels page hero carousel',
      },
      {
        label: 'Social Gallery',
        href: '/dashboard/content/social-gallery',
        icon: Images,
        description: 'Homepage community imagery',
      },
    ],
  },
  {
    label: 'Marketing',
    items: [
      {
        label: 'Coupons',
        href: '/dashboard/marketing',
        icon: Megaphone,
        description: 'Discounts and campaigns',
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        label: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        description: 'Store configuration',
      },
    ],
  },
];

export const wholesaleNavGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard/wholesale',
        icon: Truck,
        description: 'B2B snapshot',
      },
    ],
  },
  {
    label: 'B2B Sales',
    items: [
      {
        label: 'Inquiries',
        href: '/dashboard/wholesale/inquiries',
        icon: ClipboardList,
        description: 'Applications and approvals',
      },
      {
        label: 'Customers',
        href: '/dashboard/wholesale/customers',
        icon: Users,
        description: 'Approved wholesale accounts',
      },
      {
        label: 'Orders',
        href: '/dashboard/wholesale/orders',
        icon: ShoppingBag,
        description: 'B2B order queue',
      },
    ],
  },
  {
    label: 'Pricing',
    items: [
      {
        label: 'Tiers',
        href: '/dashboard/wholesale/tiers',
        icon: Landmark,
        description: 'Discount programs',
      },
    ],
  },
  {
    label: 'Wholesale Content',
    items: [
      {
        label: 'Page Content',
        href: '/dashboard/wholesale/page-content',
        icon: FileText,
        description: 'Wholesale landing page',
      },
      {
        label: 'Footer Resources',
        href: '/dashboard/wholesale/footer-links',
        icon: FileText,
        description: 'Wholesale PDF and policy links',
      },
    ],
  },
];

export const retailPrimaryNavItems = retailNavGroups[0].items;
export const retailMoreNavItems = retailNavGroups.slice(1).flatMap((group) => group.items);
export const wholesaleNavItems = wholesaleNavGroups.flatMap((group) => group.items);
export const primaryNavItems = retailPrimaryNavItems;
export const moreNavItems = retailMoreNavItems;

export function getDashboardMode(pathname: string): DashboardMode {
  if (
    pathname.startsWith('/dashboard/wholesale') ||
    pathname.startsWith('/dashboard/wholesale-page') ||
    pathname === '/dashboard/settings/tiers' ||
    pathname === '/dashboard/content/footer-links'
  ) {
    return 'wholesale';
  }

  return 'retail';
}

export function getNavItemsForMode(mode: DashboardMode): NavItem[] {
  if (mode === 'wholesale') {
    return wholesaleNavItems;
  }

  return retailNavGroups.flatMap((group) => group.items);
}

export function getNavGroupsForMode(mode: DashboardMode): NavGroup[] {
  if (mode === 'wholesale') {
    return wholesaleNavGroups;
  }

  return retailNavGroups;
}

export function isNavItemActive(pathname: string, href: string) {
  if (href === '/dashboard' || href === '/dashboard/wholesale') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
