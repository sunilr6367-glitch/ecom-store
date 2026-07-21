'use client';

import type React from 'react';
import Link from 'next/link';
import type { Product } from '@/types';
import { buildProductImageAlt } from '@/lib/seo';
import { getProductDisplayTitle } from '@/lib/product-title';
import { cn } from '@/lib/utils';
import OptimizedImage from '@/components/ui/OptimizedImage';
import WishlistButton from '@/components/ui/WishlistButton';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Button, IconButton } from '@/components/ui/Button';
import { Check, ShoppingBag } from 'lucide-react';

export interface ProductCardPrice {
  label: string;
  isWholesale?: boolean;
  compareAtLabel?: string | null;
  moq?: number;
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
  showQuickView = true,
  actionLabel,
  onAddToCart,
  onQuickView,
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
    <article className="product-card group">
      <div className="product-media">
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
              className="object-cover"
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
            {isOnSale && (
              <Badge variant="sale" className="absolute left-2 top-2 z-10 sm:left-3 sm:top-3">
                Sale
              </Badge>
            )}
            {price.moq && (
              <Badge variant="warning" className="absolute left-2 bottom-2 z-10 sm:left-3 sm:bottom-3 text-[10px]">
                MOQ: {price.moq}
              </Badge>
            )}
            {isLowStock ? (
              <Badge variant="accent" className="rounded-[var(--ds-radius-pill)] px-[var(--ds-space-xs)] py-1">
                Almost Gone
              </Badge>
            ) : null}
          </div>
        </Link>

      </div>

      <div className="product-wish">
        <WishlistButton
          productId={product.id}
          title={displayTitle}
          price={firstVariant?.prices?.[0]?.amount || 0}
          currency={currency}
            thumbnail={primaryImage || undefined}
          handle={product.handle || product.id}
          variantId={firstVariant?.id}
          size="sm"
        />
      </div>

      <div className="product-info">
        <p className="product-cat">{categoryLabel || product.collection?.title || product.subtitle || 'Odhvica'}</p>
        <Link href={href}>
          <h3 className="product-name" title={displayTitle}>
            {displayTitle}
          </h3>
        </Link>

        {(materialCue || colorValues.length > 0) ? (
          <div className="product-merch-cues" aria-label="Product details">
            {colorValues.length > 0 ? (
              <span className="product-swatch-row" aria-label={`Available colors: ${colorValues.join(', ')}`}>
                {colorValues.map((color) => (
                  <span
                    key={color}
                    className={cn('product-swatch', getSwatchClassName(color))}
                    title={color}
                  />
                ))}
              </span>
            ) : null}
            {materialCue ? <span className="product-material-chip">{materialCue}</span> : null}
          </div>
        ) : null}

        <div className="product-row">
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
          className="product-card-cart-button"
          aria-label={added ? 'Added to cart' : 'Add to cart'}
        >
            {added ? (
              <Check aria-hidden="true" size={16} strokeWidth={2} />
            ) : (
              <ShoppingBag aria-hidden="true" size={15} strokeWidth={1.9} />
            )}
          </IconButton>
        </div>
        {actionLabel ? (
          <Link href={href} className="product-card-shop-link">
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
          <div className="recently-empty-image flex h-full w-full items-center justify-center">
            <ShoppingBag aria-hidden="true" size={22} strokeWidth={1.4} />
          </div>
        )}
      </div>
      <h3
        className={cn('recently-name line-clamp-1 transition-colors', titleClassName)}
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
          priceClassName={cn('recently-price', priceClassName)}
        />
      ) : null}
    </Link>
  );
}
