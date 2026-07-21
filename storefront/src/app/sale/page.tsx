'use client';


import { Heading } from '@/design-system';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import ProductGrid from '@/components/ProductGrid';
import { ButtonLink } from '@/design-system';
import { EmptyState } from '@/design-system';
import { filterStorefrontReadyProducts } from '@/lib/storefront-product-quality';
import type { MoneyAmount, Product } from '@/types';

type Campaign = {
  id: string;
  name: string;
  description?: string | null;
  end_date?: string | null;
};

function getCurrentPrice(product: Product) {
  const prices = product.variants?.[0]?.prices || [];
  const inrPrice =
    prices.find((price: MoneyAmount) => price.currency_code?.toLowerCase() === 'inr') ||
    prices[0];

  return inrPrice?.amount || 0;
}

function hasSalePrice(product: Product) {
  const variant = product.variants?.[0];
  const compareAt = variant?.compare_at_price || 0;
  const currentPrice = getCurrentPrice(product);

  return compareAt > 0 && currentPrice > 0 && compareAt > currentPrice;
}

export default function SalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogFallback, setCatalogFallback] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    Promise.all([api.getProducts({ limit: 50, sort: 'newest' }), api.getActiveCampaigns()])
      .then(([data, campaignData]) => {
        const readyProducts = filterStorefrontReadyProducts(data.products || []);
        const saleProducts = readyProducts.filter(hasSalePrice).slice(0, 24);
        setProducts(saleProducts);
        setCatalogFallback(readyProducts.slice(0, 8));
        const campaign = (campaignData.campaigns || []).find(
          (item: Campaign) => item.name?.toLowerCase().includes('sale') || item.end_date
        );
        setActiveCampaign(campaign || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const campaignEndDate = activeCampaign?.end_date ?? null;

  useEffect(() => {
    if (!campaignEndDate) {
      const clearCountdown = window.setTimeout(() => setTimeLeft(null), 0);
      return () => window.clearTimeout(clearCountdown);
    }

    const updateCountdown = () => {
      const remaining = new Date(campaignEndDate).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeft(null);
        return;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      setTimeLeft({
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    };

    const firstTick = window.setTimeout(updateCountdown, 0);
    const timer = window.setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, [campaignEndDate]);

  return (
    <div className="min-h-screen bg-surface-paper">
      <section className="kv-page-gutter border-b border-border-subtle bg-parchment px-6 py-14 md:px-12 md:py-20 lg:px-20">
        <div className="kv-page-frame mx-auto max-w-page space-y-6 text-center">
          <span className="text-body-xs font-bold tracking-token-wider text-accent">
            {activeCampaign ? 'Limited Time' : 'Current Markdowns'}
          </span>
          <Heading role="page" className="font-display text-display-xl font-medium leading-token-tight tracking-token-normal text-primary">
            {activeCampaign?.name || 'Sale'}
          </Heading>
          <p className="mx-auto max-w-xl text-body-lg leading-token-relaxed text-secondary">
            {activeCampaign?.description ||
              'Selected artisan pieces at special prices, powered by real product markdowns.'}
          </p>
          {timeLeft ? (
            <div className="mx-auto grid max-w-xl grid-cols-4 gap-3">
              {[
                ['Days', timeLeft.days],
                ['Hours', timeLeft.hours],
                ['Mins', timeLeft.minutes],
                ['Secs', timeLeft.seconds],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="border border-border-subtle bg-surface-paper px-4 py-4"
                >
                  <span className="block font-display text-display-md leading-token-tight text-primary">
                    {String(value).padStart(2, '0')}
                  </span>
                  <span className="mt-2 block text-body-xs font-semibold tracking-token-wider text-muted">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          <a
            href="#saleGrid"
            className="inline-flex items-center justify-center rounded-sm bg-primary px-8 py-4 text-body-xs font-semibold tracking-token-wider text-inverse transition-colors hover:bg-secondary"
          >
            Shop Sale
          </a>
        </div>
      </section>

      <div id="saleGrid" className="ds-page-container mx-auto max-w-page py-token-xl md:py-token-2xl lg:py-token-3xl">
        {products.length > 0 || loading ? (
          <ProductGrid
            initialProducts={products}
            loading={loading}
            emptyMessage="No sale items currently available."
          />
        ) : (
          <div className="space-y-10">
            <EmptyState
              title="No live markdowns right now."
              description="Fresh arrivals and curated collections are still available while the next campaign is prepared."
              className="rounded-lg bg-surface-soft"
              actions={
                <>
                  <ButtonLink href="/products?sort=newest" variant="secondary" size="md">
                    New Arrivals
                  </ButtonLink>
                  <ButtonLink href="/collections" variant="outline" size="md">
                    Collections
                  </ButtonLink>
                </>
              }
            />
            {catalogFallback.length > 0 ? (
              <div>
                <h2 className="mb-5 font-display text-display-sm font-semibold text-primary">
                  Fresh catalog picks
                </h2>
                <ProductGrid initialProducts={catalogFallback} />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
