'use client';

import { Heart, Search, User, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { IconButton } from '@/design-system';
import { RegionSelector } from '@/components/region/RegionSelector';

interface ActionsRightProps {
  onSearchOpen: () => void;
  onCartOpen: () => void;
  isTransparent?: boolean;
}

export function ActionsRight({ onCartOpen, isTransparent = false }: ActionsRightProps) {
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();

  const iconCls = isTransparent
    ? 'relative inline-flex min-h-[var(--ds-control-sm)] min-w-[var(--ds-control-sm)] items-center justify-center rounded-full text-inverse transition-colors hover:bg-[rgba(var(--ds-white-rgb),0.15)] hover:text-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)]'
    : 'relative inline-flex min-h-[var(--ds-control-sm)] min-w-[var(--ds-control-sm)] items-center justify-center rounded-full text-secondary transition-colors hover:bg-[rgba(var(--ds-surface-paper-rgb),0.6)] hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)]';

  const ringCls = isTransparent ? 'ring-surface-page' : 'ring-surface-parchment';

  return (
    <div className="flex items-center justify-end gap-1.5">
      <RegionSelector compact isTransparent={isTransparent} className="mr-2" />

      <Link href="/search" className={iconCls} aria-label="Search">
        <Search size={20} strokeWidth={1.4} />
      </Link>

      <Link href="/account" className={iconCls} aria-label="My Account">
        <User size={20} strokeWidth={1.4} />
      </Link>

      <Link
        href="/wishlist"
        className={iconCls}
        aria-label={`Wishlist, ${wishlistCount} items`}
      >
        <Heart size={20} strokeWidth={1.4} />
        {wishlistCount > 0 && (
          <span className={`kv-count-badge absolute right-0.5 top-0.5 h-3.5 min-w-3.5 rounded-full bg-accent px-0.5 text-inverse ring-[1.5px] ${ringCls}`}>
            {wishlistCount > 9 ? '9+' : wishlistCount}
          </span>
        )}
      </Link>

      <IconButton
        type="button"
        onClick={onCartOpen}
        variant="ghost"
        size="sm"
        className={iconCls}
        aria-label={`Cart, ${totalItems} items`}
      >
        <ShoppingBag size={20} strokeWidth={1.4} />
        {totalItems > 0 && (
          <span className={`kv-count-badge absolute right-0.5 top-0.5 h-3.5 min-w-3.5 rounded-full bg-accent px-0.5 text-inverse ring-[1.5px] ${ringCls}`}>
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        )}
      </IconButton>
    </div>
  );
}
