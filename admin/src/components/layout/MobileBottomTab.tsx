'use client';

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  ShoppingBag,
  Users,
} from 'lucide-react';
import {
  getDashboardMode,
  isNavItemActive,
} from '@/components/layout/navigation';

interface MobileBottomTabProps {
  pendingOrders: number;
  isDrawerOpen: boolean;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
}

type NavTab = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  badge?: boolean;
  fab?: boolean;
};

const retailTabs: NavTab[] = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag, badge: true },
  { label: '', href: '/dashboard/products/new', icon: Package, fab: true },
  { label: 'Customers', href: '/dashboard/customers', icon: Users },
];

const wholesaleTabs: NavTab[] = [
  { label: 'Home', href: '/dashboard/wholesale', icon: LayoutDashboard },
  {
    label: 'Inquiries',
    href: '/dashboard/wholesale/inquiries',
    icon: ClipboardList,
  },
  { label: 'Orders', href: '/dashboard/wholesale/orders', icon: ShoppingBag },
  { label: 'Customers', href: '/dashboard/wholesale/customers', icon: Users },
];

export default function MobileBottomTab({
  pendingOrders,
  isDrawerOpen,
  onOpenDrawer,
}: MobileBottomTabProps) {
  const pathname = usePathname();
  const mode = getDashboardMode(pathname);
  const tabs = mode === 'wholesale' ? wholesaleTabs : retailTabs;

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around rounded-t-3xl bg-white/90 px-4 pb-6 pt-3 shadow-[0_-8px_24px_-4px_rgba(25,28,30,0.08)] backdrop-blur-md md:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isNavItemActive(pathname, tab.href);

        if (tab.fab) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="h-14 w-14 -mt-10 rounded-full bg-[var(--primary)] text-white shadow-lg duration-150 active:scale-90 flex items-center justify-center"
              aria-label="Add product"
            >
              <Icon size={22} />
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 active:scale-90 ${
              active
                ? 'text-[var(--primary)]'
                : 'text-[var(--on-surface-variant)] hover:text-[var(--primary)]'
            }`}
          >
            <Icon size={22} />
            <span className="font-['Inter'] text-[10px] font-medium">
              {tab.label}
            </span>
            {tab.badge && pendingOrders > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--error)] px-1 text-[9px] font-bold text-white">
                {pendingOrders > 9 ? '9+' : pendingOrders}
              </span>
            )}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenDrawer}
        className={`flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 active:scale-90 ${
          isDrawerOpen
            ? 'text-[var(--primary)]'
            : 'text-[var(--on-surface-variant)] hover:text-[var(--primary)]'
        }`}
      >
        <MoreHorizontal size={22} />
        <span className="font-['Inter'] text-[10px] font-medium">More</span>
      </button>
    </nav>
  );
}
