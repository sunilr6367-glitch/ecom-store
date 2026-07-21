'use client';

import { useCart } from '@/context/cart-context';
import { Drawer, OptimizedImage, UnstyledButton } from '@/design-system';
import Link from 'next/link';
import { useCurrency } from '@/context/currency-context';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { items, removeItem, updateQuantity, cartTotal } = useCart();
  const { formatPrice } = useCurrency();

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Your Cart (${items.length})`}
      className="max-w-md"
      bodyClassName="flex flex-col p-0"
    >
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-[var(--ds-space-md)] text-center">
              <p className="text-muted mb-4">Your cart is empty</p>
              <Link
                href="/products"
                onClick={onClose}
                className="text-body-sm font-medium text-primary underline"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--ds-border-subtle)]">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-[var(--ds-space-sm)] p-[var(--ds-space-sm)]">
                  {/* Image */}
                  <div className="relative h-20 w-20 flex-shrink-0 bg-surface-soft overflow-hidden">
                    {item.thumbnail ? (
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted">
                        <span className="text-body-xs">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-body-sm font-medium text-primary truncate">
                      <Link
                        href={`/products/${item.handle || item.id}`}
                        onClick={onClose}
                      >
                        {item.title}
                      </Link>
                    </h3>
                    <p className="text-body-sm text-muted mt-1">
                      {formatPrice(item.price)}
                    </p>
                    {(item.material || item.origin) && (
                      <div className="mt-1 text-body-xs text-muted">
                        {item.material && <span>{item.material}</span>}
                        {item.material && item.origin && <span> · </span>}
                        {item.origin && <span>{item.origin}</span>}
                      </div>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-[var(--ds-space-xs)]">
                        <UnstyledButton
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="p-1 min-h-[44px] min-w-[44px] text-muted hover:text-secondary disabled:opacity-30 flex items-center justify-center"
                          aria-label={`Decrease quantity of ${item.title}`}
                        >
                          <Minus size={14} />
                        </UnstyledButton>
                        <span className="text-body-sm w-6 text-center">
                          {item.quantity}
                        </span>
                        <UnstyledButton
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          className="p-1 min-h-[44px] min-w-[44px] text-muted hover:text-secondary flex items-center justify-center"
                          aria-label={`Increase quantity of ${item.title}`}
                        >
                          <Plus size={14} />
                        </UnstyledButton>
                      </div>

                      <UnstyledButton
                        onClick={() => removeItem(item.variantId)}
                        className="p-1 min-h-[44px] min-w-[44px] text-muted hover:text-error flex items-center justify-center"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </UnstyledButton>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-body-sm font-medium text-primary">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border-subtle px-6 py-4 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-secondary">Subtotal</span>
              <span className="text-body-xl font-medium text-primary">
                {formatPrice(cartTotal)}
              </span>
            </div>
            <p className="text-body-xs text-muted">
              Shipping and taxes calculated at checkout
            </p>

            {/* Actions */}
            <div className="space-y-2">
              <Link
                href="/cart"
                onClick={onClose}
                className="block w-full text-center py-3 border border-border text-primary text-body-sm font-medium hover:bg-parchment transition-colors"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={onClose}
                className="block w-full text-center py-3 bg-primary text-inverse text-body-sm font-medium hover:bg-secondary transition-colors"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
    </Drawer>
  );
}
