'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MoneyAmount, Product } from '@/types';
import { useCart } from '@/context/cart-context';
import { useNotification } from '@/context/notification-context';
import { useWholesale } from '@/context/wholesale-context';
import { ProductCard } from '@/components/products/ProductCard';
import { useCurrency } from '@/context/currency-context';
import { getProductDisplayTitle } from '@/lib/product-title';
import { filterStorefrontReadyProducts } from '@/lib/storefront-product-quality';
import {
  HomepageSection,
  HomepageSectionHeader,
  homepageScrollRailClassName,
  homepageSectionActionClassName,
} from '@/design-system';

interface ProductPriceInfo {
  price: string;
  isWholesale: boolean;
  savings: number;
  compareAtLabel?: string | null;
  discountPercent?: number;
}

export function NewArrivals({
  products: initialProducts,
}: {
  products: Product[];
}) {
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { showNotification } = useNotification();
  const { wholesaleInfo, getPrice: getWholesalePrice, fetchPrices } = useWholesale();
  const [addedId, setAddedId] = useState<string | null>(null);

  const products = filterStorefrontReadyProducts(initialProducts || [], {
    requireSellablePrice: false,
  });

  useEffect(() => {
    if (wholesaleInfo?.hasWholesaleAccess && products.length > 0 && fetchPrices) {
      const variantIds = products
        .map((product) => product.variants?.[0]?.id)
        .filter(Boolean) as string[];

      if (variantIds.length > 0) {
        fetchPrices(variantIds).catch(console.error);
      }
    }
  }, [wholesaleInfo, products, fetchPrices]);

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

  const getPrice = (product: Product): ProductPriceInfo => {
    const variant = product.variants?.[0];
    const prices = variant?.prices || [];
    const inrPrice =
      prices.find((money: MoneyAmount) => money.currency_code?.toLowerCase() === 'inr') ||
      prices[0];

    if (!inrPrice) {
      return { price: 'Contact for price', isWholesale: false, savings: 0 };
    }

    const retailPrice = inrPrice.amount;

    if (variant?.id && wholesaleInfo?.hasWholesaleAccess) {
      const wholesale = getWholesalePrice(variant.id, retailPrice);
      if (wholesale.isWholesale) {
        return {
          price: formatPrice(wholesale.price),
          isWholesale: true,
          savings: wholesale.savings,
          discountPercent: wholesaleInfo.discountPercent,
        };
      }
    }

    return {
      price: formatPrice(inrPrice.amount),
      isWholesale: false,
      savings: 0,
      compareAtLabel:
        variant?.compare_at_price && variant.compare_at_price > inrPrice.amount
          ? formatPrice(variant.compare_at_price)
          : null,
    };
  };

  if (products.length === 0) return null;

  return (
    <HomepageSection data-home-section="8-new-arrivals">
      <HomepageSectionHeader
        heading="New Arrivals"
        headingClassName="font-light italic tracking-wide"
        action={
          <Link href="/products?sort=newest" className={homepageSectionActionClassName}>
            View All New Arrivals
          </Link>
        }
      />

      <div
        className={`${homepageScrollRailClassName} gap-4 pb-[var(--ds-home-section-space-mobile)] lg:gap-8 lg:pb-[var(--ds-home-section-space-desktop)] [&_.product-card]:rounded-none [&_.product-card]:border-none [&_.product-card]:bg-transparent [&_.product-card]:shadow-none [&_.product-info]:py-[var(--ds-space-sm)]`}
      >
        {products.map((product) => {
          const priceInfo = getPrice(product);
          return (
            <div key={product.id} className="w-[45vw] max-w-[280px] flex-shrink-0 animate-fade-in md:w-[calc(33.33%-1rem)] lg:w-[calc(25%-1.5rem)]">
              <ProductCard
                product={product}
                price={{
                  label: priceInfo.price,
                  compareAtLabel: priceInfo.compareAtLabel,
                  isWholesale: priceInfo.isWholesale,
                }}
                onAddToCart={handleAddToCart}
                added={addedId === product.id}
                showQuickView={false}
              />
            </div>
          );
        })}
      </div>
    </HomepageSection>
  );
}
