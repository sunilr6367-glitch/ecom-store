'use client';

import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/wishlist-context';
import { useShop } from '@/context/shop-context';
import { cn } from '@/lib/utils';
import { Button, IconButton } from '@/components/ui/Button';

interface WishlistButtonProps {
  productId: string;
  title: string;
  price: number;
  currency?: string;
  thumbnail?: string;
  handle: string;
  variantId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function WishlistButton({
  productId,
  title,
  price,
  currency = 'USD',
  thumbnail,
  handle,
  variantId,
  className = '',
  size = 'md',
  showLabel = false,
}: WishlistButtonProps) {
  const { isInWishlist, toggleItem } = useWishlist();
  const { currentRegion } = useShop();

  const isWishlisted = isInWishlist(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const item = {
      productId,
      variantId,
      title,
      price,
      currency: currentRegion?.currency_code?.toUpperCase() || currency,
      thumbnail,
      handle,
    };

    toggleItem(item);
  };

  const sizeClasses = {
    sm: 'h-[var(--ds-control-icon-sm)] w-[var(--ds-control-icon-sm)]',
    md: 'h-[var(--ds-control-icon-md)] w-[var(--ds-control-icon-md)]',
    lg: 'h-[var(--ds-control-icon-lg)] w-[var(--ds-control-icon-lg)]',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  const buttonSizes = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  } as const;

  const label = isWishlisted ? 'Remove from wishlist' : 'Add to wishlist';

  if (showLabel) {
    return (
      <Button
        type="button"
        onClick={handleClick}
        variant="ghost"
        size={buttonSizes[size]}
        className={cn(
          isWishlisted
            ? 'text-error hover:brightness-95'
            : 'text-secondary hover:text-error',
          className
        )}
        aria-label={label}
        title={label}
        leadingIcon={(
          <Heart
            size={iconSizes[size]}
            strokeWidth={isWishlisted ? 2.5 : 1.5}
            className={cn(
              'transition-transform duration-200',
              isWishlisted ? 'fill-current' : 'hover:scale-110'
            )}
          />
        )}
      >
        {isWishlisted ? 'Saved' : 'Save'}
      </Button>
    );
  }

  return (
    <IconButton
      type="button"
      onClick={handleClick}
      variant="ghost"
      size={size}
      className={cn(
        'rounded-full transition-all duration-200',
        isWishlisted
          ? 'bg-danger-bg text-error hover:brightness-95'
          : 'bg-surface-paper/90 text-muted hover:bg-surface-paper hover:text-error',
        sizeClasses[size],
        className
      )}
      aria-label={label}
      title={label}
    >
      <Heart
        size={iconSizes[size]}
        strokeWidth={isWishlisted ? 2.5 : 1.5}
        className={cn(
          'transition-transform duration-200',
          isWishlisted ? 'fill-current' : 'hover:scale-110'
        )}
      />
    </IconButton>
  );
}
