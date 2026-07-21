'use client';

import type React from 'react';
import Link from 'next/link';
import type { Product } from '@/types';
import { buildProductImageAlt } from '@/lib/seo';
import { getProductDisplayTitle } from '@/lib/product-title';
import { cn } from '@/lib/utils';
import { Badge, IconButton, OptimizedImage, PriceDisplay, WishlistButton } from '@/design-system';
import { Check, ShoppingBag } from 'lucide-react';

export interface ProductCardPrice {
  label: string;
  isWholesale?: boolean;
  compareAtLabel?: string | null;
}

interface ProductCardProps {
  product: Product;
  price: ProductCardPrice;
  index?: number;
  added?: boolean;
  currency?: string;
  categoryLabel?: string;
  showQuickView?: boolean;
  actionLabel?: string;
  onAddToCart: (event: React.MouseEvent<HTMLButtonElement>, product: Product) => void;
  onQuickView?: (product: Product) => void;
  rating?: number;
  reviewsCount?: number;
}

const SWATCH_CLASS_BY_SLUG: Record<string, string> = {
  navy: 'product-swatch--navy',
  blue: 'product-swatch--blue',
  'off-white': 'product-swatch--off-white',
  white: 'product-swatch--off-white',
  cream: 'product-swatch--cream',
  olive: 'product-swatch--olive',
  green: 'product-swatch--green',
  red: 'product-swatch--red',
  orange: 'product-swatch--orange',
  yellow: 'product-swatch--yellow',
  beige: 'product-swatch--beige',
  brown: 'product-swatch--brown',
  pink: 'product-swatch--pink',
  purple: 'product-swatch--purple',
  grey: 'product-swatch--grey',
  gray: 'product-swatch--grey',
};

function getSwatchClassName(color: string) {
  const slug = color.toLowerCase().trim().replace(/\s+/g, '-');
  return SWATCH_CLASS_BY_SLUG[slug] || 'product-swatch--fallback';
}

export function ProductCard({
  product,
  price,
  index = 0,
  added = false,
  currency = 'USD',
  categoryLabel,
  showQuickView: _showQuickView = true,
  actionLabel,
  onAddToCart,
  onQuickView: _onQuickView,
  rating,
  reviewsCount,
}: ProductCardProps) {
  const displayTitle = getProductDisplayTitle(product.title);
  const href = `/products/${product.handle || product.id}`;
  const firstVariant = product.variants?.[0];
  const stockQty = firstVariant?.inventory_quantity || 0;
  const isNew = index < 4;
  const isOnSale = Boolean(price.compareAtLabel);
  const isLowStock = stockQty > 0 && stockQty <= 5;
  const primaryImage = product.thumbnail || product.images?.find((image) => image.url)?.url;
  const secondImage = product.images?.find((image) => image.url && image.url !== primaryImage)?.url;
  const colorValues = [
    product.attributes?.find((attribute) => attribute.attribute_code?.toLowerCase() === 'color')?.value_label,
    product.attributes?.find((attribute) => attribute.attribute_code?.toLowerCase() === 'colour')?.value_label,
    product.merchant?.find((item) => item.color)?.color,
    firstVariant?.merchant?.color,
  ]
    .filter(Boolean)
    .slice(0, 3) as string[];
  const materialCue =
    product.material ||
    product.attributes?.find((attribute) => attribute.attribute_code?.toLowerCase() === 'material')?.value_label ||
    firstVariant?.merchant?.material ||
    product.merchant?.find((item) => item.material)?.material ||
    null;

  return (
    <article className="product-card relative bg-transparent overflow-hidden group">
      <div className="relative aspect-[4/5] grid place-items-center font-body text-body-md leading-normal bg-surface-soft overflow-hidden group-hover:saturate-[1.06] focus-within:saturate-[1.06]">
        <Link
          href={href}
          className="relative block h-full w-full"
          aria-label={`View ${displayTitle}`}
        >
          {primaryImage ? (
            <OptimizedImage
              src={primaryImage}
              alt={buildProductImageAlt(product, 0)}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
              className="object-cover motion-safe:transition-transform duration-[2000ms] ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="product-no-image flex h-full w-full items-center justify-center bg-surface-soft">
              <ShoppingBag aria-hidden="true" size={28} strokeWidth={1.4} />
            </div>
          )}

          {secondImage ? (
            <OptimizedImage
              src={secondImage}
              alt={buildProductImageAlt(product, 1)}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="absolute inset-0 object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          ) : null}

          <div className="absolute left-[9px] top-[9px] z-10 flex max-w-[calc(100%-58px)] flex-col items-start gap-1.5">
            {isNew && !isOnSale ? (
              <Badge className="rounded-[var(--ds-radius-pill)] px-[var(--ds-space-xs)] py-1">New</Badge>
            ) : null}
            {isOnSale ? (
              <Badge variant="danger" className="rounded-[var(--ds-radius-pill)] px-[var(--ds-space-xs)] py-1">
                Sale
              </Badge>
            ) : null}
            {isLowStock ? (
              <Badge variant="accent" className="rounded-[var(--ds-radius-pill)] px-[var(--ds-space-xs)] py-1 font-bold">
                ONLY {stockQty} LEFT
              </Badge>
            ) : null}
          </div>
        </Link>

      </div>

      <WishlistButton
        productId={product.id}
        title={displayTitle}
        price={firstVariant?.prices?.[0]?.amount || 0}
        currency={currency}
        thumbnail={primaryImage || undefined}
        handle={product.handle || product.id}
        variantId={firstVariant?.id}
        size="sm"
        className="absolute right-[var(--ds-space-xs)] top-[var(--ds-space-xs)] z-10 border-0 shadow-[0_2px_8px_rgba(var(--ds-black-rgb),.12)]"
      />

      <div className="p-[var(--ds-space-xs)]">
        <p className="text-muted font-label text-body-xs font-[var(--ds-type-label-weight)] tracking-[var(--ds-type-product-meta-tracking)] uppercase italic font-light">{categoryLabel || product.collection?.title || product.subtitle || 'Odhvica'}</p>
        <Link href={href}>
          <h3 className="mt-[3px] mx-0 mb-[var(--ds-space-xs)] font-[var(--ds-type-product-title-font)] text-type-product-title-size font-[var(--ds-type-product-title-weight)] leading-snug tracking-normal text-primary max-w-[var(--ds-caption-width)] min-h-[2.5em] overflow-hidden line-clamp-2" title={displayTitle}>
            {displayTitle}
          </h3>
        </Link>

        {(materialCue || colorValues.length > 0) ? (
          <div className="flex min-h-[22px] items-center gap-[var(--ds-space-xs)] m-0 mb-[var(--ds-space-xs)] overflow-hidden" aria-label="Product details">
            {colorValues.length > 0 ? (
              <span className="inline-flex items-center gap-1 flex-none" aria-label={`Available colors: ${colorValues.join(', ')}`}>
                {colorValues.map((color) => (
                  <span
                    key={color}
                    className={cn('w-[13px] h-[13px] rounded-full border border-[rgba(var(--ds-ink-rgb),0.14)] shadow-[inset_0_0_0_1px_rgba(var(--ds-white-rgb),0.42)]', getSwatchClassName(color))}
                    title={color}
                  />
                ))}
              </span>
            ) : null}
            {materialCue ? <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-muted font-label text-body-xs font-[var(--ds-type-label-weight)] tracking-[var(--ds-type-product-meta-tracking)] uppercase">{materialCue}</span> : null}
          </div>
        ) : null}

        <div className="flex min-h-[var(--ds-control-sm)] items-center justify-between gap-[var(--ds-space-xs)]">
          <PriceDisplay
            price={price.label}
            compareAtPrice={price.compareAtLabel}
            prefix={price.isWholesale ? 'Wholesale -' : undefined}
            variant="product-card"
            priceClassName={price.isWholesale ? 'wholesale-price' : undefined}
          />
          <IconButton
            type="button"
            onClick={(event) => onAddToCart(event, product)}
            variant={added ? 'primary' : 'ghost'}
            size="sm"
            className="flex-none rounded-[var(--ds-radius-sm)] font-body font-[var(--ds-type-ui-weight)] text-primary hover:bg-accent hover:text-inverse"
            aria-label={added ? 'Added to cart' : 'Add to cart'}
          >
            {added ? (
              <Check aria-hidden="true" size={16} strokeWidth={2} />
            ) : (
              <ShoppingBag aria-hidden="true" size={15} strokeWidth={1.9} />
            )}
          </IconButton>
        </div>

        {/* Rating Display */}
        {(rating !== undefined && reviewsCount !== undefined) ? (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex text-accent" aria-label={`Rating: ${rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className={`w-3.5 h-3.5 ${star <= rating ? 'fill-current' : 'fill-transparent stroke-current stroke-[1.5px]'}`} viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <span className="text-xs font-ui text-muted">({reviewsCount})</span>
          </div>
        ) : null}

        {actionLabel ? (
          <Link href={href} className="inline-flex mt-[var(--ds-space-xs)] text-primary text-body-xs font-[var(--ds-type-ui-weight)] underline underline-offset-4 hover:text-accent">
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

interface CompactProductCardProps {
  title: string;
  href: string;
  thumbnail?: string | null;
  priceLabel?: string;
  imageAlt?: string;
  imageSizes?: string;
  className?: string;
  imageClassName?: string;
  titleClassName?: string;
  priceClassName?: string;
  onClick?: () => void;
}

export function CompactProductCard({
  title,
  href,
  thumbnail,
  priceLabel,
  imageAlt,
  imageSizes = '(max-width: 768px) 50vw, 16vw',
  className,
  imageClassName,
  titleClassName,
  priceClassName,
  onClick,
}: CompactProductCardProps) {
  return (
    <Link href={href} onClick={onClick} className={cn('group block', className)}>
      <div
        className={cn(
          'relative mb-3 aspect-[3/4] overflow-hidden rounded-sm bg-surface-soft',
          imageClassName
        )}
      >
        {thumbnail ? (
          <OptimizedImage
            src={thumbnail}
            alt={imageAlt || title}
            fill
            sizes={imageSizes}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-body text-body-xs italic text-muted">
            <ShoppingBag aria-hidden="true" size={22} strokeWidth={1.4} />
          </div>
        )}
      </div>
      <h3
        className={cn('font-body text-body-md font-[var(--ds-type-ui-weight)] leading-snug tracking-normal text-primary line-clamp-1 transition-colors', titleClassName)}
        title={title}
      >
        {title}
      </h3>
      {priceLabel ? (
        <PriceDisplay
          as="p"
          price={priceLabel}
          variant="compact"
          className="mt-1"
          priceClassName={cn('font-body text-body-sm font-[var(--ds-type-body-weight)] text-muted', priceClassName)}
        />
      ) : null}
    </Link>
  );
}
