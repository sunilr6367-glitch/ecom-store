'use client';

import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';
import { useCurrency } from '@/context/currency-context';
import { Drawer, OptimizedImage, UnstyledButton } from '@/design-system';
import Link from 'next/link';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
} from 'lucide-react';

interface CartDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalItems, cartTotal } =
    useCart();
  const { settings } = useShop();
  const { formatPrice } = useCurrency();

  // Free shipping threshold (in cents)
  const freeShippingThreshold = settings?.free_shipping_threshold || 25000;
  const shippingProgress = Math.min(
    (cartTotal / freeShippingThreshold) * 100,
    100
  );
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cartTotal);
  const hasFreeShipping = cartTotal >= freeShippingThreshold;
  const getItemHref = (item: { handle?: string; title: string }) =>
    item.handle
      ? `/products/${item.handle}`
      : `/search?q=${encodeURIComponent(item.title)}`;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-[var(--ds-space-xs)]">
            <ShoppingBag size={18} className="text-primary" />
            <span className="text-body-sm font-bold  tracking-token-wider text-primary">
              Your Bag
            </span>
            {totalItems > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-body-xs font-bold text-inverse">
                {totalItems}
              </span>
            )}
        </span>
      }
      className="sm:max-w-[400px]"
      bodyClassName="flex flex-col p-0"
    >

        {/* Free Shipping Progress Bar */}
        {items.length > 0 && (
          <div className="border-b border-border-subtle bg-surface px-[var(--ds-space-md)] py-[var(--ds-space-xs)]">
            {hasFreeShipping ? (
              <div className="flex items-center gap-2 text-body-xs text-success font-medium">
                <Truck size={14} />
                <span>You&apos;ve unlocked FREE shipping! ✦</span>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between text-body-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <Truck size={12} />
                    {formatPrice(amountToFreeShipping)} away from free shipping
                  </span>
                  <span className="font-medium text-primary">
                    {Math.round(shippingProgress)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border-subtle">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--ds-accent-gold),var(--ds-footer-highlight),var(--ds-accent-gold))] bg-[length:200%_auto] transition-all duration-500 ease-out animate-[goldShimmer_3s_linear_infinite]"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Cart Items — Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full px-[var(--ds-space-md)] text-center">
              <div className="w-20 h-20 rounded-[var(--ds-radius-pill)] bg-surface flex items-center justify-center mb-5">
                <ShoppingBag className="h-8 w-8 text-muted" />
              </div>
              <p className="mb-2 font-display text-body-md text-primary">
                Your bag is empty
              </p>
              <p className="mb-6 text-body-xs leading-token-relaxed text-muted">
                Discover our curated collection of handcrafted pieces
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="inline-flex min-h-[var(--ds-control-sm)] items-center gap-2 bg-primary px-8 py-3 text-body-xs font-bold tracking-token-wider text-inverse transition-opacity hover:opacity-90"
              >
                Explore Collection <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {items.map((item, index) => (
                <li
                  key={item.variantId}
                  className="flex gap-[var(--ds-space-sm)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)] group/item animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Product Image */}
                  <Link
                    href={getItemHref(item)}
                    onClick={onClose}
                    className="relative w-[72px] h-[90px] flex-shrink-0 bg-surface-soft overflow-hidden rounded-[var(--radius-sm)]"
                  >
                    {item.thumbnail ? (
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link
                        href={getItemHref(item)}
                        onClick={onClose}
                        className="block line-clamp-2 text-body-sm font-medium leading-token-tight text-primary transition-colors hover:text-muted"
                      >
                        {item.title}
                      </Link>
                      {item.material && (
                        <p className="mt-0.5 text-body-xs tracking-token-wider text-muted">
                          {item.material}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-border-subtle rounded-[var(--radius-sm)]">
                        <UnstyledButton
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          className="flex min-h-[var(--ds-control-sm)] min-w-[var(--ds-control-sm)] items-center justify-center text-muted transition-colors hover:text-primary"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </UnstyledButton>
                        <span className="min-w-[var(--ds-control-sm)] text-center text-body-xs font-medium text-primary">
                          {item.quantity}
                        </span>
                        <UnstyledButton
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          className="flex min-h-[var(--ds-control-sm)] min-w-[var(--ds-control-sm)] items-center justify-center text-muted transition-colors hover:text-primary"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </UnstyledButton>
                      </div>

                      {/* Price */}
                      <span className="text-body-sm font-medium text-primary">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <UnstyledButton
                    onClick={() => removeItem(item.variantId)}
                    className="self-start p-2 text-muted opacity-100 transition-colors hover:text-error focus-visible:opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100"
                    aria-label="Remove item"
                  >
                    <Trash2 size={14} />
                  </UnstyledButton>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — Subtotal + Checkout */}
        {items.length > 0 && (
          <div className="border-t border-border-subtle bg-surface-paper">
            {/* Subtotal */}
            <div className="px-[var(--ds-space-md)] py-[var(--ds-space-sm)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-body-xs tracking-token-wider text-muted">
                  Subtotal
                </span>
                <span className="text-body-md font-medium text-primary">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-xs tracking-token-wider text-muted">
                  Shipping
                </span>
                <span className="text-body-xs text-muted">
                  {hasFreeShipping ? (
                    <span className="text-success font-medium">FREE ✦</span>
                  ) : (
                    'Calculated at checkout'
                  )}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <div className="px-[var(--ds-space-md)] pb-[var(--ds-space-sm)] space-y-3">
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex min-h-[var(--ds-control-md)] w-full items-center justify-center gap-2 bg-primary py-3.5 text-body-xs font-bold tracking-token-wider text-inverse transition-opacity hover:opacity-90"
              >
                Checkout — {formatPrice(cartTotal)}
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="flex min-h-[var(--ds-control-md)] w-full items-center justify-center gap-[var(--ds-space-xs)] border border-border-subtle py-3 text-body-xs font-bold tracking-token-wider text-primary transition-colors hover:bg-surface"
              >
                View Full Cart
              </Link>
            </div>

            {/* Secure Checkout Badge */}
            <div className="flex items-center justify-center gap-[var(--ds-space-xs)] pb-[var(--ds-space-sm)] text-body-xs text-muted">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Secure checkout via Stripe</span>
            </div>
          </div>
        )}
    </Drawer>
  );
}
