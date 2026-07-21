'use client';

import Link from 'next/link';
import { Package, Heart, Clock, MessageCircle } from 'lucide-react';
import { useWishlist } from '@/context/wishlist-context';
import { useRecentlyViewed } from '@/context/recently-viewed-context';

export function QuickGrid() {
  const { totalItems: wishlistCount } = useWishlist();
  const { items: recentlyViewed } = useRecentlyViewed();

  const gridItems = [
    {
      href: '/account/orders',
      icon: Package,
      label: 'Orders',
      count: null,
      active: true,
    },
    {
      href: '/wishlist',
      icon: Heart,
      label: 'Wishlist',
      count: wishlistCount > 0 ? wishlistCount : null,
      active: true,
    },
    {
      href: '/products?sort=newest',
      icon: Clock,
      label: 'Recently Viewed',
      count: recentlyViewed.length > 0 ? recentlyViewed.length : null,
      active: true,
    },
    {
      href: '/account/messages',
      icon: MessageCircle,
      label: 'Messages',
      count: null,
      active: true,
    },
  ];

  return (
    <div className="bg-surface-paper border-b border-border-subtle p-4">
      <div className="grid grid-cols-2 gap-3">
        {gridItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center p-4 border border-border-subtle hover:border-border hover:bg-parchment transition-all"
            >
              <div className="relative">
                <Icon size={22} strokeWidth={1.5} className="text-secondary" />
                {item.count !== null && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-inverse text-body-xs font-bold rounded-full flex items-center justify-center">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="text-body-xs font-medium text-secondary mt-2">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

