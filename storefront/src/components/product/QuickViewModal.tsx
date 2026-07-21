'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
  Button,
  IconButton,
  Modal,
  OptimizedImage,
  PriceDisplay,
  RatingDisplay,
  UnstyledButton,
} from '@/design-system';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { useCurrency } from '@/context/currency-context';
import { api } from '@/lib/api';
import { getProductDisplayTitle } from '@/lib/product-title';
import { cn } from '@/lib/utils';

interface QuickViewProduct {
  id: string;
  title: string;
  handle: string;
  description?: string;
  thumbnail?: string | null;
  images?: Array<{ url: string | null }> | string[];
  variants?: Array<{
    id: string;
    title: string;
    prices?: Array<{ amount: number; currency_code: string }>;
    inventory_quantity?: number;
  }>;
}

interface QuickViewModalProps {
  product: QuickViewProduct;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);
  const [imgIndex, setImgIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewAvg, setReviewAvg] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const displayTitle = getProductDisplayTitle(product.title);
  const addedTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSelectedVariant(product.variants?.[0]);
    setImgIndex(0);
    setAdded(false);
    setError(null);
    setReviewAvg(null);
    setReviewCount(0);
  }, [product.id, product.variants]);

  useEffect(() => () => { if (addedTimer.current) clearTimeout(addedTimer.current); }, []);

  useEffect(() => {
    if (!isOpen || !product.id) return;
    let cancelled = false;
    api.getReviews(product.id).then((data) => {
      if (cancelled) return;
      const list: Array<{ rating: number }> = data.reviews || [];
      if (list.length > 0) {
        setReviewAvg(list.reduce((s, r) => s + r.rating, 0) / list.length);
        setReviewCount(list.length);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isOpen, product.id]);

  const images: string[] = [];
  if (product.images?.length) {
    for (const img of product.images) {
      const url = typeof img === 'string' ? img : img.url;
      if (url) images.push(url);
    }
  }
  if (!images.length && product.thumbnail) images.push(product.thumbnail);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (images.length <= 1) return;
      if (e.key === 'ArrowLeft') setImgIndex((current) => Math.max(0, current - 1));
      if (e.key === 'ArrowRight') {
        setImgIndex((current) => Math.min(images.length - 1, current + 1));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, isOpen, onClose]);

  const priceObj =
    (selectedVariant?.prices || []).find((p) => p.currency_code?.toLowerCase() === 'inr') ||
    selectedVariant?.prices?.[0];
  const price = priceObj?.amount || 0;

  async function handleAddToCart() {
    setAdding(true);
    setError(null);
    try {
      await addItem({
        id: selectedVariant?.id || product.id,
        variantId: selectedVariant?.id || product.id,
        quantity: 1,
        title: displayTitle,
        price,
        currency: 'INR',
        thumbnail: product.thumbnail || undefined,
        handle: product.handle || product.id,
      });
      setAdded(true);
      if (addedTimer.current) clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAdded(false), 2200);
    } catch {
      setError('Could not add to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={<span className="quickview-title line-clamp-1">{displayTitle}</span>}
      className="max-w-4xl"
    >
        <div>
          {/* Two-col on md+, single col on mobile. */}
          <div className="grid gap-[var(--ds-space-sm)] sm:grid-cols-2">

            {/* Aspect-ratio box so height is always defined. */}
            <div className="min-h-[280px] sm:min-h-[360px] rounded-[var(--ds-radius-lg)] grid place-items-center text-display-xl font-display bg-surface-soft overflow-hidden relative p-0">
              {images.length > 0 ? (
                <>
                  <div className="relative aspect-[4/5] w-full">
                    <OptimizedImage
                      src={images[imgIndex] || images[0]}
                      alt={displayTitle}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {images.length > 1 && (
                    <>
                      <IconButton
                        type="button"
                        onClick={() => setImgIndex((current) => Math.max(0, current - 1))}
                        disabled={imgIndex === 0}
                        aria-label="Show previous product image"
                        variant="outline"
                        size="sm"
                        className="bg-[color-mix(in_srgb,var(--ds-surface-paper)_86%,transparent)] shadow-md absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full"
                      >
                        <ChevronLeft size={16} />
                      </IconButton>
                      <IconButton
                        type="button"
                        onClick={() =>
                          setImgIndex((current) => Math.min(images.length - 1, current + 1))
                        }
                        disabled={imgIndex === images.length - 1}
                        aria-label="Show next product image"
                        variant="outline"
                        size="sm"
                        className="bg-[color-mix(in_srgb,var(--ds-surface-paper)_86%,transparent)] shadow-md absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full"
                      >
                        <ChevronRight size={16} />
                      </IconButton>
                      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                        {images.map((image, index) => (
                          <UnstyledButton
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => setImgIndex(index)}
                            aria-label={`Show product image ${index + 1}`}
                            className={`rounded-full transition-all ${
                              index === imgIndex ? 'h-1.5 w-4 bg-primary' : 'h-1.5 w-1.5 bg-primary/25'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <span>{displayTitle.charAt(0)}</span>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col gap-3">

              {reviewAvg !== null && (
                <RatingDisplay
                  rating={reviewAvg}
                  count={reviewCount}
                  className="quickview-rating-count"
                />
              )}

              <PriceDisplay
                price={price ? formatPrice(price) : 'Contact for price'}
                variant="pdp"
                priceClassName="pd-price"
              />

              {/* Description */}
              {product.description ? (
                <p className="quickview-description">
                  {product.description}
                </p>
              ) : null}

              {/* Variants */}
              {product.variants && product.variants.length > 1 && (
                <div>
                  <strong className="font-label text-body-xs font-[var(--ds-type-label-weight)] tracking-[var(--ds-type-product-meta-tracking)] uppercase text-muted block mb-1">Variant</strong>
                  <div className="flex flex-wrap gap-[var(--ds-space-xs)] my-[var(--ds-space-xs)] mb-[var(--ds-space-sm)]">
                    {product.variants.map((v) => {
                      const isActive = selectedVariant?.id === v.id;
                      return (
                        <UnstyledButton
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={cn(
                            'min-h-[var(--ds-control-sm)] px-[var(--ds-space-sm)] border-[1.5px] rounded-[var(--ds-radius-sm)] text-body-sm font-[var(--ds-type-strong-weight)] transition-[150ms_ease] hover:border-accent hover:text-accent',
                            isActive 
                              ? 'border-primary bg-primary text-inverse' 
                              : 'border-border-subtle bg-surface-paper text-primary'
                          )}
                        >
                          {v.title}
                        </UnstyledButton>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <p className="input-error-message">{error}</p>
              )}

              {/* CTAs */}
              <div className="mt-auto grid gap-2.5">
                <Button
                  onClick={handleAddToCart}
                  disabled={adding}
                  variant={added ? "success" : "secondary"}
                  size="lg"
                  fullWidth
                  className={added ? '!bg-success !border-success !text-inverse' : ''}
                  leadingIcon={
                    added ? <Check size={15} /> : adding ? undefined : <ShoppingBag size={15} />
                  }
                >
                  {adding ? 'Adding...' : added ? 'Added to Cart' : 'Add to Cart'}
                </Button>
                <Link
                  href={`/products/${product.handle || product.id}`}
                  onClick={onClose}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-[var(--ds-space-xs)] border border-border bg-surface-paper px-[var(--ds-space-md)] text-primary font-body text-body-sm font-[var(--ds-type-strong-weight)] tracking-[var(--ds-type-button-tracking)] uppercase transition-[160ms_ease] hover:border-accent hover:text-accent"
                >
                  Full Details
                </Link>
              </div>
            </div>
          </div>
        </div>
    </Modal>
  );
}
