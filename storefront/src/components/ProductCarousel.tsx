"use client";

import React, { useState } from 'react';
import type { MoneyAmount, Product } from '@/types';
import { useCart } from '@/context/cart-context';
import { useCurrency } from '@/context/currency-context';
import { useNotification } from '@/context/notification-context';
import { useShop } from '@/context/shop-context';
import { ProductCard } from '@/components/products/ProductCard';
import { EmptyState } from '@/design-system';
import { getProductDisplayTitle } from '@/lib/product-title';
import { filterStorefrontReadyProducts } from '@/lib/storefront-product-quality';

interface ProductCarouselProps {
  products?: Product[];
  loading?: boolean;
  showNavigation?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

function ProductCarousel({
  products = [],
  loading: externalLoading,
}: ProductCarouselProps) {
  const { currentRegion } = useShop();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { showNotification } = useNotification();
  const [addedId, setAddedId] = useState<string | null>(null);
  const loading = externalLoading === true;
  const displayProducts = filterStorefrontReadyProducts(products);

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>, product: Product) => {
    event.preventDefault();
    if (!product.variants || product.variants.length === 0) {
      showNotification('error', 'Product unavailable');
      return;
    }

    const variant = product.variants[0];
    const prices = variant.prices || [];
    const inrPrice =
      prices.find((price: MoneyAmount) => price.currency_code?.toLowerCase() === 'inr') ||
      prices[0];

    if (!inrPrice) {
      showNotification('error', 'Price unavailable for this region');
      return;
    }

    addItem({
      id: variant.id,
      variantId: variant.id,
      quantity: 1,
      title: getProductDisplayTitle(product.title),
      price: inrPrice.amount,
      currency: 'INR',
      thumbnail: product.thumbnail || undefined,
      material: product.material || undefined,
      origin: product.origin_country || undefined,
      sku: variant.sku || undefined,
      description: product.description || undefined,
      handle: product.handle || product.id,
    });

    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1000);
  };

  const getPrice = (product: Product) => {
    const variant = product.variants?.[0];
    const prices = variant?.prices || [];
    const inrPrice =
      prices.find((price: MoneyAmount) => price.currency_code?.toLowerCase() === 'inr') ||
      prices[0];

    if (!inrPrice) {
      return { label: 'Contact for price', compareAtLabel: null };
    }

    return {
      label: formatPrice(inrPrice.amount),
      compareAtLabel:
        variant?.compare_at_price && variant.compare_at_price > inrPrice.amount
          ? formatPrice(variant.compare_at_price)
          : null,
    };
  };

  if (loading) {
    return (
      <div className="grid grid-flow-col auto-cols-[85vw] sm:auto-cols-[45vw] md:auto-cols-[30vw] lg:auto-cols-[22vw] gap-[var(--ds-space-xs)] overflow-x-auto snap-x snap-mandatory md:gap-[var(--ds-space-sm)] pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="product-card animate-pulse">
            <div className="product-media bg-surface-soft" />
            <div className="product-info">
              <div className="skeleton-line skeleton-line-brand" />
              <div className="skeleton-line skeleton-line-name" />
              <div className="skeleton-line skeleton-line-price" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayProducts.length === 0) {
    return <EmptyState title="No products found." className="product-empty-state" />;
  }

  return (
    <div className="grid grid-flow-col auto-cols-[85vw] sm:auto-cols-[45vw] md:auto-cols-[30vw] lg:auto-cols-[22vw] gap-[var(--ds-space-xs)] overflow-x-auto snap-x snap-mandatory md:gap-[var(--ds-space-sm)] pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
      {displayProducts.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          price={getPrice(product)}
          index={index}
          added={addedId === product.id}
          currency={currentRegion?.currency_code?.toUpperCase() || 'USD'}
          categoryLabel={product.subtitle || product.collection?.title || 'Odhvica'}
          showQuickView={false}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
}

export default React.memo(ProductCarousel);
