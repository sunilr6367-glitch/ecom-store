'use client';

import Link from 'next/link';
import {
  HomepageSection,
  HomepageSectionHeader,
  OptimizedImage,
  PriceDisplay,
  homepageScrollRailClassName,
  homepageSectionActionClassName,
} from '@/design-system';
import { useCurrency } from '@/context/currency-context';
import type { MoneyAmount } from '@/types';
import type { HomepageTrendingReel } from '@/types/homepage';
import { Play } from 'lucide-react';

export function WatchBuyPreview({ reels }: { reels: HomepageTrendingReel[] }) {
  const { formatPrice } = useCurrency();

  if (reels.length === 0) return null;

  return (
    <HomepageSection data-home-section="12-watch-shop">
      <HomepageSectionHeader
        heading="See the craft in motion"
        headingClassName="font-medium"
        action={
          <Link href="/reels" className={homepageSectionActionClassName}>
            View All
          </Link>
        }
      />

      <div className={`${homepageScrollRailClassName} gap-[var(--ds-space-sm)]`}>
        {reels.map((reel) => {
          const prices = reel.product.variants?.[0]?.prices || [];
          const amount =
            prices.find((item: MoneyAmount) => item.currency_code?.toLowerCase() === 'inr') ||
            prices[0];
          const price = amount ? formatPrice(amount.amount) : null;
          const productHref = reel.link_url || `/products/${reel.product.handle || reel.product.id}`;

          return (
            <div key={reel.id} className="group w-[180px] flex-shrink-0 animate-fade-in md:w-[230px]">
              <Link
                href={`/reels?id=${reel.id}`}
                className="relative block overflow-hidden rounded-[var(--ds-radius-md)] bg-surface-soft aspect-[9/16]"
              >
                <OptimizedImage
                  src={reel.thumbnail_url}
                  alt={reel.caption || reel.product.title}
                  fill
                  sizes="(max-width: 767px) 180px, 230px"
                  className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[var(--ds-transition)] motion-safe:group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-[rgba(var(--ds-black-rgb),0.25)] transition-colors group-hover:bg-[rgba(var(--ds-black-rgb),0.35)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(var(--ds-white-rgb),0.95)] text-primary shadow-md transition-transform duration-300 group-hover:scale-110">
                    <Play size={20} fill="currentColor" className="ml-1" />
                  </span>
                </div>
              </Link>

              <div className="mt-[var(--ds-space-xs)] text-left">
                <h3
                  className="line-clamp-1 text-body-sm font-medium text-primary transition-colors group-hover:text-accent"
                  title={reel.product.title}
                >
                  {reel.product.title}
                </h3>
                <div className="mt-1 flex items-center justify-between">
                  {price ? <PriceDisplay price={price} variant="inline" /> : <span />}
                  <Link
                    href={productHref}
                    className="inline-flex min-h-[var(--ds-control-sm)] items-center text-body-xs font-ui font-semibold uppercase tracking-wider text-accent-gold transition-colors hover:text-primary"
                  >
                    Shop
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </HomepageSection>
  );
}
