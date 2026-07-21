import { Button } from '@/components/ui/Button';

export function ProductFilterBar() {
  return (
    <div className="w-full bg-[var(--ds-surface-paper)] border-b border-[var(--ds-border-subtle)] py-4 sticky top-16 z-40">
      <div className="mx-auto max-w-[var(--ds-content-width)] px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-4 items-center w-full overflow-x-auto pb-2 sm:pb-0">
          <Button variant="ghost" size="sm" className="font-bold text-[var(--ds-text-primary)]">All Products</Button>
          <Button variant="ghost" size="sm">New Arrivals</Button>
          <Button variant="ghost" size="sm">Low MOQ</Button>
          <Button variant="ghost" size="sm">Ready to Ship</Button>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          <select className="bg-transparent text-sm font-medium border border-border-subtle rounded-md py-1.5 px-3">
            <option>Sort by: Featured</option>
            <option>Wholesale Price: Low to High</option>
            <option>Wholesale Price: High to Low</option>
            <option>MOQ: Low to High</option>
          </select>
        </div>
      </div>
    </div>
  );
}
