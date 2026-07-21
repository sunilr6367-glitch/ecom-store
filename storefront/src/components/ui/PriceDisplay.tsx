import type { ElementType, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type PriceDisplayVariant = 'product-card' | 'compact' | 'pdp' | 'inline';

interface PriceDisplayProps extends HTMLAttributes<HTMLElement> {
  price: string;
  compareAtPrice?: string | null;
  prefix?: string;
  variant?: PriceDisplayVariant;
  as?: ElementType;
  priceClassName?: string;
  compareAtClassName?: string;
}

const rootClasses: Record<PriceDisplayVariant, string> = {
  'product-card': 'inline-flex items-baseline gap-1.5',
  compact: 'inline-flex items-baseline gap-1.5',
  pdp: 'inline-flex flex-wrap items-baseline gap-[var(--ds-space-xs)]',
  inline: 'inline-flex items-baseline gap-1.5',
};

const priceClasses: Record<PriceDisplayVariant, string> = {
  'product-card':
    'font-body text-body-sm font-semibold tracking-token-normal text-price',
  compact:
    'font-body text-body-sm font-normal tracking-token-normal text-muted',
  pdp:
    'font-body text-display-sm font-bold tracking-token-normal text-price',
  inline:
    'font-body text-body-sm font-semibold tracking-token-normal text-price',
};

const compareAtClasses: Record<PriceDisplayVariant, string> = {
  'product-card':
    'font-body text-body-xs font-normal tracking-token-normal text-price-old line-through',
  compact:
    'font-body text-body-xs font-normal tracking-token-normal text-price-old line-through',
  pdp:
    'font-body text-body-sm font-normal tracking-token-normal text-price-old line-through',
  inline:
    'font-body text-body-xs font-normal tracking-token-normal text-price-old line-through',
};

export function PriceDisplay({
  price,
  compareAtPrice,
  prefix,
  variant = 'inline',
  as,
  className,
  priceClassName,
  compareAtClassName,
  ...props
}: PriceDisplayProps) {
  const Component = as || 'span';

  return (
    <Component className={cn(rootClasses[variant], className)} {...props}>
      <span className={cn(priceClasses[variant], priceClassName)}>
        {prefix ? `${prefix} ${price}` : price}
      </span>
      {compareAtPrice ? (
        <span className={cn(compareAtClasses[variant], compareAtClassName)}>
          {compareAtPrice}
        </span>
      ) : null}
    </Component>
  );
}

