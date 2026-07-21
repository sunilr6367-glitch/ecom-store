import Link from 'next/link';
import { ButtonLink, OptimizedImage, PriceDisplay, homepageSectionActionClassName } from '@/design-system';
import { ArrowUpRight } from 'lucide-react';
import type { HomepageSpotlightProduct } from '@/types/homepage';

interface ShopTheLookProps {
  spotlightProducts: HomepageSpotlightProduct[];
}

function formatCurrency(amount?: number, currencyCode = 'INR') {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export function ShopTheLook({ spotlightProducts }: ShopTheLookProps) {
  if (spotlightProducts.length === 0) return null;

  const items = spotlightProducts
    .map((item) => ({
      id: item.id,
      product: item.product,
      image:
        item.custom_image_url ||
        item.product.thumbnail,
    }))
    .filter((item) => Boolean(item.product?.id && item.product?.title && item.image))
    .slice(0, 3);

  if (items.length === 0) return null;

  return (
    <section className="max-md:py-[var(--ds-space-md)] bg-surface-paper">
      <div className="ds-home-container">
        <div className="flex flex-col gap-[var(--ds-space-sm)] md:flex-row md:items-end md:justify-between">
          <div className="kv-tag">Style Story</div>
          <Link href="/products" className={homepageSectionActionClassName}>
            View All
          </Link>
        </div>

        <div className="grid gap-[var(--ds-space-xs)] sm:grid-cols-3 md:gap-[var(--ds-space-sm)]">
          {items.map((item, index) => {
            const price = item.product.variants?.[0]?.prices?.[0];
            const href = `/products/${item.product.handle || item.product.id}`;

            return (
              <Link
                key={item.id}
                href={href}
                className="group relative block aspect-[3/4] overflow-hidden bg-surface-soft"
              >
                <OptimizedImage
                  src={item.image || ''}
                  alt={item.product.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(var(--ds-black-rgb),0.02)_30%,rgba(var(--ds-black-rgb),0.72)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-inverse sm:p-4 md:p-6">
                  <div className="mb-3 flex items-center justify-between gap-4 text-body-xs font-bold tracking-[var(--ds-type-label-tracking)] text-inverse/80">
                    <span>Look {String(index + 1).padStart(2, '0')}</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={1.8}
                    />
                  </div>
                  <h3 className="line-clamp-2 font-display text-display-sm leading-[var(--ds-leading-tight)] text-inverse">
                    {item.product.title}
                  </h3>
                  {price ? (
                    <PriceDisplay
                      as="p"
                      price={formatCurrency(price.amount, price.currency_code)}
                      variant="compact"
                      className="mt-2"
                      priceClassName="text-body-xs font-bold tracking-[var(--ds-type-label-tracking)] text-inverse/78"
                    />
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 border-t border-border-subtle pt-5 md:grid-cols-[1fr,auto] md:items-center">
          <p className="kv-sub max-w-[680px]">
            Curated pieces styled as complete festive edits, so every print,
            layer, and accessory feels intentional.
          </p>
          <ButtonLink 
            href="/products" 
            variant="outline" 
            size="lg"
            className="mt-[var(--ds-space-lg)] w-full"
          >
            Shop All
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
