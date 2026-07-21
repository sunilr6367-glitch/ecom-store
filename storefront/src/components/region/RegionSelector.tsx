'use client';

import { Globe2 } from 'lucide-react';
import { useShop } from '@/context/shop-context';
import { getSelectableRegions } from '@/lib/regions';
import { cn } from '@/lib/utils';

interface RegionSelectorProps {
  compact?: boolean;
  isTransparent?: boolean;
  onRegionChange?: () => void;
  className?: string;
}

export function RegionSelector({
  compact = false,
  isTransparent = false,
  onRegionChange,
  className,
}: RegionSelectorProps) {
  const { currentRegion, regions, setRegion, isLoading } = useShop();
  const selectableRegions = getSelectableRegions(regions);

  if (isLoading || selectableRegions.length === 0) return null;

  return (
    <label
      className={cn(
        'flex items-center gap-2 text-body-sm',
        isTransparent ? 'text-inverse' : 'text-secondary',
        className
      )}
    >
      <Globe2 size={compact ? 16 : 18} strokeWidth={1.5} aria-hidden="true" />
      <span className="sr-only">Shopping region</span>
      <select
        aria-label="Shopping region"
        value={currentRegion?.id || ''}
        onChange={(event) => {
          const nextRegion = selectableRegions.find(
            (region) => region.id === event.target.value
          );
          if (!nextRegion) return;
          setRegion(nextRegion);
          onRegionChange?.();
        }}
        className={cn(
          'max-w-44 border border-border-subtle bg-surface-paper px-2 text-primary outline-none transition-colors focus:border-accent',
          compact ? 'h-9 text-body-xs' : 'h-11 w-full text-body-sm'
        )}
      >
        {selectableRegions.map((region) => (
          <option key={region.id} value={region.id}>
            {region.name} ({region.currency_code.toUpperCase()})
          </option>
        ))}
      </select>
    </label>
  );
}
