'use client';

import React from 'react';
import { useRecentlyViewed } from '@/context/recently-viewed-context';
import Link from 'next/link';
import { useCurrency } from '@/context/currency-context';
import { CompactProductCard } from '@/components/products/ProductCard';

interface RecentlyViewedRowProps {
  currentProductId?: string;
}

function RecentlyViewedRowComponent({ currentProductId = '' }: RecentlyViewedRowProps) {
  const { items } = useRecentlyViewed();
  const { formatPrice } = useCurrency();

  // Filter out current product and show last 6
  const filtered = items
    .filter((item) => item.id !== currentProductId)
    .slice(0, 6);

  if (filtered.length === 0) return null;

  return (
    <section className="border-t border-border-subtle bg-parchment py-[var(--ds-space-xl)] md:py-[var(--ds-space-2xl)] lg:py-[var(--ds-space-3xl)]">
      <div className="ds-page-container mx-auto max-w-page">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="recently-eyebrow mb-1 block">
              Your Journey
            </span>
            <h2 className="recently-section-heading">
              Recently Viewed
            </h2>
          </div>
          <Link
            href="/products"
            className="recently-link flex items-center gap-1 transition-colors"
          >
            View All →
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-6 md:gap-6 md:overflow-visible md:pb-0 lg:gap-8 scrollbar-hide">
          {filtered.map((item) => (
            <CompactProductCard
              key={item.id}
              href={`/products/${item.handle}`}
              title={item.title}
              thumbnail={item.thumbnail}
              priceLabel={formatPrice(item.price)}
              imageSizes="(max-width: 768px) 144px, 16vw"
              className="flex-none w-36 md:w-auto"
              titleClassName="mb-1 truncate"
              priceClassName="mt-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export const RecentlyViewedRow = React.memo(RecentlyViewedRowComponent);
