/**
 * Tax Calculator Utility
 *
 * Calculates GST (CGST + SGST) for Indian tax structure
 * Default rate: 18% (9% CGST + 9% SGST)
 */

export interface TaxBreakdown {
  rate: number; // GST rate (e.g., 18)
  subtotal: number; // Pre-tax amount in cents
  cgst: number; // Central GST in cents (rate/2)
  sgst: number; // State GST in cents (rate/2)
  total: number; // Total tax in cents
}

/**
 * Calculate GST tax breakdown
 *
 * @param subtotal - Pre-tax amount in cents
 * @param rate - GST rate percentage (default: 18)
 * @returns TaxBreakdown with cgst, sgst, and total
 */
export function calculateTax(
  subtotal: number,
  rate: number = 18
): TaxBreakdown {
  // Calculate total tax (split equally between CGST and SGST)
  const totalTax = Math.round(subtotal * (rate / 100));
  const halfRate = rate / 2;
  const cgst = Math.round(subtotal * (halfRate / 100));
  const sgst = totalTax - cgst; // Ensure exact split

  return {
    rate,
    subtotal,
    cgst,
    sgst,
    total: cgst + sgst,
  };
}

/**
 * Calculate tax with custom rate
 */
export function calculateTaxWithRate(
  subtotal: number,
  rate: number
): TaxBreakdown {
  return calculateTax(subtotal, rate);
}
