'use client';

interface QuantityCalculatorProps {
  quantity: number;
  setQuantity: (val: number) => void;
  minQuantity: number;
  unitPrice: number;
}

export function QuantityCalculator({
  quantity,
  setQuantity,
  minQuantity,
  unitPrice
}: QuantityCalculatorProps) {
  const handleBlur = () => {
    if (quantity < minQuantity) {
      setQuantity(minQuantity);
    }
  };

  const increment = () => setQuantity(quantity + 1);
  const decrement = () => {
    if (quantity > minQuantity) setQuantity(quantity - 1);
  };

  const totalEstimate = quantity * unitPrice;

  return (
    <div className="flex flex-col gap-4 my-6 bg-[var(--ds-surface-soft)] p-4 rounded-md border border-[var(--ds-border-subtle)]">
      <div className="flex items-center justify-between">
        <label htmlFor="quantity" className="font-medium text-sm text-[var(--ds-text-primary)]">Quantity</label>
        {minQuantity > 1 && (
          <span className="text-xs text-[var(--ds-danger)] font-medium">Min order: {minQuantity} pcs</span>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-[var(--ds-border-subtle)] rounded-md bg-[var(--ds-surface-page)]">
          <button 
            type="button" 
            onClick={decrement}
            disabled={quantity <= minQuantity}
            className="w-10 h-10 flex items-center justify-center text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] disabled:opacity-30 transition-colors"
          >
            &minus;
          </button>
          <input
            id="quantity"
            type="number"
            min={minQuantity}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || minQuantity)}
            onBlur={handleBlur}
            className="w-16 text-center font-medium bg-transparent border-none focus:outline-none focus:ring-0 p-0 m-0"
          />
          <button 
            type="button" 
            onClick={increment}
            className="w-10 h-10 flex items-center justify-center text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors"
          >
            &#43;
          </button>
        </div>
        
        <div className="flex-1 text-right">
          <p className="text-xs text-[var(--ds-text-secondary)] mb-1">Estimated Total</p>
          <p className="font-heading text-xl font-bold text-[var(--ds-text-primary)]">
            ₹{totalEstimate.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
