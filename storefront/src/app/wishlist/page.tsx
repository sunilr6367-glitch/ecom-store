'use client';


import { Heading } from '@/design-system';
import { useWishlist, WishlistItem } from '@/context/wishlist-context';
import { useCart } from '@/context/cart-context';
import { useNotification } from '@/context/notification-context';
import { useCurrency } from '@/context/currency-context';
import { OptimizedImage } from '@/design-system';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Button, IconButton } from '@/design-system';
import { EmptyState } from '@/design-system';
import { PriceDisplay } from '@/design-system';

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const { showNotification } = useNotification();
  const { formatPrice } = useCurrency();

  const handleAddToCart = (item: WishlistItem) => {
    addItem({
      id: item.variantId || item.productId,
      variantId: item.variantId || item.productId,
      quantity: 1,
      title: item.title,
      price: item.price,
      currency: item.currency,
      thumbnail: item.thumbnail,
      handle: item.handle,
    });
    showNotification('success', 'Added to cart');
    removeItem(item.productId);
  };

  const handleRemove = (productId: string) => {
    removeItem(productId);
    showNotification('info', 'Removed from wishlist');
  };


  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-surface-paper py-token-xl md:py-token-2xl lg:py-token-3xl">
        <div className="ds-page-container mx-auto max-w-page">
          <EmptyState
            icon={<Heart size={56} />}
            title="Your Wishlist is Empty"
            description="Save items you love by clicking the heart icon on any product."
            actions={
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary text-inverse px-8 py-3 text-body-xs font-bold  tracking-token-wider hover:bg-secondary transition-colors"
            >
              Start Shopping
              <ArrowRight size={16} />
            </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-paper py-token-xl md:py-token-2xl lg:py-token-3xl">
      <div className="ds-page-container mx-auto max-w-page">
        <div className="flex items-center justify-between mb-12">
          <div>
            <Heading role="page" className="text-display-lg font-display text-primary mb-2">
              My Wishlist
            </Heading>
            <p className="text-muted">
              {items.length} saved item{items.length === 1 ? '' : 's'}
            </p>
          </div>
          <Button
            type="button"
            onClick={clearWishlist}
            variant="ghost"
            size="sm"
          >
            Clear All
          </Button>
        </div>

        <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 md:gap-x-6 md:gap-y-12 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="group">
              <div className="relative aspect-[3/4] bg-surface-soft mb-4 overflow-hidden rounded-sm">
                <Link href={`/products/${item.handle}`}>
                  {item.thumbnail ? (
                    <OptimizedImage
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted italic">
                      No Image
                    </div>
                  )}
                </Link>

                {/* Remove Button */}
                <IconButton
                  type="button"
                  onClick={() => handleRemove(item.productId)}
                  size="sm"
                  className="absolute right-3 top-3 rounded-full border-0 bg-surface-paper/90 text-muted hover:text-error"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 size={16} />
                </IconButton>
              </div>

              <div className="space-y-2">
                <Link href={`/products/${item.handle}`}>
                  <h3 className="font-display text-primary group-hover:text-secondary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                </Link>
                <PriceDisplay price={formatPrice(item.price)} variant="inline" />
                <Button
                  type="button"
                  onClick={() => handleAddToCart(item)}
                  variant="secondary"
                  fullWidth
                  leadingIcon={<ShoppingBag size={14} />}
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
