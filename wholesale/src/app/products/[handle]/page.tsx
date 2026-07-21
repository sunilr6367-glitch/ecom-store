'use client';

import { useState } from 'react';
import { ProductGallery } from '@/components/product/ProductGallery';
import { WholesaleVariantToggle } from '@/components/product/WholesaleVariantToggle';
import { QuantityCalculator } from '@/components/product/QuantityCalculator';
import { RequestQuoteModal } from '@/components/product/RequestQuoteModal';
import { Badge } from '@/components/ui/Badge';

// Mock Data
const MOCK_PRODUCT = {
  id: 'p1',
  title: 'Block Print Cotton Kurti',
  description: 'Hand-block printed pure cotton kurti crafted by artisans in Jaipur. Perfect for summer collections.',
  images: [
    { url: 'https://images.unsplash.com/photo-1583391733958-611591572c63?auto=format&fit=crop&q=80', alt: 'Front' },
    { url: 'https://images.unsplash.com/photo-1610030469983-98e550d61dc0?auto=format&fit=crop&q=80', alt: 'Detail' }
  ],
  material: '100% Pure Cotton',
  care: 'Hand wash cold'
};

const PRICING = {
  sample: 1500,
  bulk: 800,
  moq: 50
};

export default function WholesalePDP() {
  const [isBulk, setIsBulk] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Sync quantity boundaries when toggling
  const handleToggleBulk = (val: boolean) => {
    setIsBulk(val);
    if (val && quantity < PRICING.moq) {
      setQuantity(PRICING.moq);
    } else if (!val) {
      setQuantity(1);
    }
  };

  const currentPrice = isBulk ? PRICING.bulk : PRICING.sample;
  const minQuantity = isBulk ? PRICING.moq : 1;
  const estimatedTotal = quantity * currentPrice;
  const variantDetails = isBulk ? `Bulk Order (MOQ ${PRICING.moq}+)` : 'Sample Order (1 Unit)';

  return (
    <div className="mx-auto max-w-[var(--ds-page-width)] px-4 sm:px-6 lg:px-8 py-8 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        
        {/* Left Column: Gallery */}
        <div>
          <ProductGallery images={MOCK_PRODUCT.images as any} />
        </div>
        
        {/* Right Column: Details & B2B Logic */}
        <div className="flex flex-col">
          <Badge variant="outline" className="w-max mb-4">Export Ready</Badge>
          <h1 className="font-heading text-display-md text-[var(--ds-text-primary)] mb-2">{MOCK_PRODUCT.title}</h1>
          <p className="text-body-md text-[var(--ds-text-secondary)] mb-6">{MOCK_PRODUCT.description}</p>
          
          <div className="border-t border-b border-[var(--ds-border-subtle)] py-4 my-2">
            <h3 className="font-medium text-sm text-[var(--ds-text-primary)] mb-2">Specifications</h3>
            <ul className="text-sm text-[var(--ds-text-secondary)] space-y-1">
              <li><span className="font-medium">Material:</span> {MOCK_PRODUCT.material}</li>
              <li><span className="font-medium">Care:</span> {MOCK_PRODUCT.care}</li>
              <li><span className="font-medium">Origin:</span> Jaipur, India</li>
            </ul>
          </div>

          {/* B2B Ordering Logic */}
          <WholesaleVariantToggle 
            isBulk={isBulk} 
            setIsBulk={handleToggleBulk} 
            samplePrice={PRICING.sample}
            bulkPrice={PRICING.bulk}
            moq={PRICING.moq}
          />

          <QuantityCalculator 
            quantity={quantity}
            setQuantity={setQuantity}
            minQuantity={minQuantity}
            unitPrice={currentPrice}
          />

          <RequestQuoteModal 
            productTitle={MOCK_PRODUCT.title}
            variantDetails={variantDetails}
            quantity={quantity}
            estimatedTotal={estimatedTotal}
          />
          
        </div>
      </div>
    </div>
  );
}
