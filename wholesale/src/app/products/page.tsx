'use client';

import { ProductFilterBar } from '@/components/products/ProductFilterBar';
import { CatalogGrid } from '@/components/products/CatalogGrid';
import { ProductCard } from '@/components/products/ProductCard';

// Temporary Mock Data for UI building
const MOCK_PRODUCTS = [
  {
    id: 'p1',
    title: 'Block Print Cotton Kurti',
    handle: 'block-print-cotton-kurti',
    thumbnail: 'https://images.unsplash.com/photo-1583391733958-611591572c63?auto=format&fit=crop&q=80',
    variants: [{ inventory_quantity: 500 }]
  },
  {
    id: 'p2',
    title: 'Embroidered Silk Saree',
    handle: 'embroidered-silk-saree',
    thumbnail: 'https://images.unsplash.com/photo-1610030469983-98e550d61dc0?auto=format&fit=crop&q=80',
    variants: [{ inventory_quantity: 150 }]
  },
  {
    id: 'p3',
    title: 'Handloom Linen Tunic',
    handle: 'handloom-linen-tunic',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80',
    variants: [{ inventory_quantity: 100 }]
  },
  {
    id: 'p4',
    title: 'Festive Wear Lehenga',
    handle: 'festive-wear-lehenga',
    thumbnail: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80',
    variants: [{ inventory_quantity: 50 }]
  }
];

export default function ProductsPage() {
  return (
    <div className="w-full bg-[var(--ds-surface-page)]">
      <div className="bg-[var(--ds-surface-soft)] py-12 text-center border-b border-border-subtle">
        <h1 className="font-heading text-display-md text-[var(--ds-text-primary)]">Wholesale Catalog</h1>
        <p className="text-[var(--ds-text-secondary)] mt-4">Browse our complete collection with transparent B2B pricing and MOQs.</p>
      </div>
      
      <ProductFilterBar />
      
      <CatalogGrid>
        {MOCK_PRODUCTS.map((product, idx) => (
          <ProductCard
            key={product.id}
            product={product as any}
            price={{
              label: `Bulk: ₹${(800 + idx * 200).toFixed(2)}`,
              compareAtLabel: `Sample: ₹${(1500 + idx * 300).toFixed(2)}`,
              isWholesale: true,
              moq: 50
            }}
            onAddToCart={() => {}}
          />
        ))}
      </CatalogGrid>
    </div>
  );
}
