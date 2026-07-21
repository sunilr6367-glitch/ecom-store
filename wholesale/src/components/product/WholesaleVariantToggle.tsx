'use client';

import { Button } from '@/components/ui/Button';

interface WholesaleVariantToggleProps {
  isBulk: boolean;
  setIsBulk: (val: boolean) => void;
  samplePrice: number;
  bulkPrice: number;
  moq: number;
}

export function WholesaleVariantToggle({
  isBulk,
  setIsBulk,
  samplePrice,
  bulkPrice,
  moq
}: WholesaleVariantToggleProps) {
  return (
    <div className="flex flex-col gap-3 my-6">
      <p className="font-medium text-sm text-[var(--ds-text-primary)]">Select Order Type</p>
      <div className="flex gap-4">
        <button
          onClick={() => setIsBulk(false)}
          className={`flex-1 flex flex-col p-4 border rounded-md transition-all ${!isBulk ? 'border-[var(--ds-accent-primary)] bg-[var(--ds-accent-primary)]/5 ring-1 ring-[var(--ds-accent-primary)]' : 'border-border-subtle hover:border-[var(--ds-text-secondary)]'}`}
        >
          <span className="font-bold text-[var(--ds-text-primary)] text-sm mb-1">Sample Order</span>
          <span className="text-sm text-[var(--ds-text-secondary)]">1 Unit</span>
          <span className="mt-2 font-bold text-accent">₹{samplePrice.toLocaleString()} / unit</span>
        </button>

        <button
          onClick={() => setIsBulk(true)}
          className={`flex-1 flex flex-col p-4 border rounded-md transition-all ${isBulk ? 'border-[var(--ds-accent-primary)] bg-[var(--ds-accent-primary)]/5 ring-1 ring-[var(--ds-accent-primary)]' : 'border-border-subtle hover:border-[var(--ds-text-secondary)]'}`}
        >
          <span className="font-bold text-[var(--ds-text-primary)] text-sm mb-1">Bulk Order</span>
          <span className="text-sm text-[var(--ds-text-secondary)]">MOQ {moq}+ Units</span>
          <span className="mt-2 font-bold text-success">₹{bulkPrice.toLocaleString()} / unit</span>
        </button>
      </div>
    </div>
  );
}
