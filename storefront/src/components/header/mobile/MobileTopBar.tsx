'use client';

import Link from 'next/link';
import { Menu, X, Search, ShoppingBag, Heart } from 'lucide-react';
import { Logo } from '../Logo';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { IconButton } from '@/design-system';

interface MobileTopBarProps {
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  onSearchOpen: () => void;
  onCartOpen: () => void;
  isTransparent?: boolean;
}

export function MobileTopBar({
  isDrawerOpen,
  onToggleDrawer,
  onSearchOpen,
  onCartOpen,
  isTransparent = false,
}: MobileTopBarProps) {
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();

  const wrapperCls = isTransparent
    ? 'flex md:hidden items-center justify-between h-[54px] px-4 bg-transparent border-b border-transparent transition-all duration-300'
    : 'flex md:hidden items-center justify-between h-[54px] px-4 bg-[rgba(var(--ds-surface-paper-rgb),0.9)] backdrop-blur-md border-b border-border-subtle transition-all duration-300';

  const iconCls = isTransparent
    ? 'text-inverse transition-colors'
    : 'text-secondary hover:text-primary transition-colors';

  const menuIconColor = isTransparent ? 'text-inverse' : 'text-secondary';
  const ringCls = isTransparent ? 'ring-surface-page' : 'ring-surface-paper';

  return (
    <div className={wrapperCls}>
      <IconButton
        type="button"
        onClick={onToggleDrawer}
        variant="ghost"
        size="md"
        className="animate-fade-in"
        aria-label={isDrawerOpen ? 'Close navigation' : 'Open navigation'}
      >
        {isDrawerOpen ? (
          <X size={20} strokeWidth={1.8} className="text-accent" />
        ) : (
          <Menu size={20} strokeWidth={1.8} className={menuIconColor} />
        )}
      </IconButton>

      <Logo size="mobile" isTransparent={isTransparent} />

      <div className="flex items-center gap-3">
        <IconButton
          type="button"
          onClick={onSearchOpen}
          variant="ghost"
          size="sm"
          className={iconCls}
          aria-label="Search"
        >
          <Search size={20} strokeWidth={1.4} />
        </IconButton>
        <Link
          href="/wishlist"
          className={`relative inline-flex min-h-[var(--ds-control-sm)] min-w-[var(--ds-control-sm)] items-center justify-center ${iconCls}`}
          aria-label={`Wishlist, ${wishlistCount} items`}
        >
          <Heart size={20} strokeWidth={1.4} />
          {wishlistCount > 0 && (
            <span className={`kv-count-badge absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent text-inverse rounded-full flex items-center justify-center ring-[1.5px] ${ringCls}`}>
              {wishlistCount > 9 ? '9+' : wishlistCount}
            </span>
          )}
        </Link>
        <IconButton
          type="button"
          onClick={onCartOpen}
          variant="ghost"
          size="sm"
          className={`relative ${iconCls}`}
          aria-label={`Cart, ${totalItems} items`}
        >
          <ShoppingBag size={20} strokeWidth={1.4} />
          {totalItems > 0 && (
            <span className={`kv-count-badge absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent text-inverse rounded-full flex items-center justify-center ring-[1.5px] ${ringCls}`}>
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </IconButton>
      </div>
    </div>
  );
}
