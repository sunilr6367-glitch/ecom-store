/**
 * Pricing Strategy - Phase 4 Q19: Strategy Pattern
 *
 * Implements interchangeable pricing algorithms for different scenarios.
 *
 * Usage:
 *   import { PricingStrategy, pricingStrategies } from './strategies/pricing-strategy';
 *
 *   const strategy = pricingStrategies.percentageDiscount;
 *   const price = strategy.calculate(100, { discountPercent: 20 });
 */

import { z } from 'zod';

/**
 * Input schema for pricing calculations
 */
export const PricingInputSchema = z.object({
  basePrice: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  taxRate: z.number().min(0).optional(),
});

export type PricingInput = z.infer<typeof PricingInputSchema>;

/**
 * Output schema for pricing calculations
 */
export const PricingOutputSchema = z.object({
  subtotal: z.number(),
  discount: z.number(),
  taxableAmount: z.number(),
  tax: z.number(),
  total: z.number(),
});

export type PricingOutput = z.infer<typeof PricingOutputSchema>;

/**
 * Strategy context for pricing calculations
 */
export interface PricingStrategy {
  name: string;
  description: string;
  calculate(input: PricingInput): PricingOutput;
  validate(input: PricingInput): { valid: boolean; error?: string };
}

/**
 * Percentage discount strategy
 */
export const percentageDiscountStrategy: PricingStrategy = {
  name: 'percentage_discount',
  description: 'Apply percentage-based discount',

  calculate(input: PricingInput): PricingOutput {
    const { basePrice, quantity, discountPercent = 0 } = input;
    const subtotal = basePrice * quantity;
    const discount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * (input.taxRate || 0);
    const total = taxableAmount + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  },

  validate(input: PricingInput): { valid: boolean; error?: string } {
    if (
      input.discountPercent !== undefined &&
      (input.discountPercent < 0 || input.discountPercent > 100)
    ) {
      return {
        valid: false,
        error: 'Discount percent must be between 0 and 100',
      };
    }
    return { valid: true };
  },
};

/**
 * Fixed amount discount strategy
 */
export const fixedDiscountStrategy: PricingStrategy = {
  name: 'fixed_discount',
  description: 'Apply fixed amount discount',

  calculate(input: PricingInput): PricingOutput {
    const { basePrice, quantity, discountAmount = 0 } = input;
    const subtotal = basePrice * quantity;
    const discount = Math.min(discountAmount, subtotal); // Can't discount more than subtotal
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * (input.taxRate || 0);
    const total = taxableAmount + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  },

  validate(input: PricingInput): { valid: boolean; error?: string } {
    if (input.discountAmount !== undefined && input.discountAmount < 0) {
      return { valid: false, error: 'Discount amount must be positive' };
    }
    return { valid: true };
  },
};

/**
 * Tiered pricing strategy (bulk discounts)
 */
export const tieredPricingStrategy: PricingStrategy = {
  name: 'tiered_pricing',
  description: 'Apply tiered/bulk discounts based on quantity',

  calculate(input: PricingInput): PricingOutput {
    const { basePrice, quantity } = input;
    const subtotal = basePrice * quantity;

    // Determine discount tier
    let discountPercent = 0;
    if (quantity >= 100) {
      discountPercent = 20;
    } else if (quantity >= 50) {
      discountPercent = 15;
    } else if (quantity >= 25) {
      discountPercent = 10;
    } else if (quantity >= 10) {
      discountPercent = 5;
    }

    const discount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * (input.taxRate || 0);
    const total = taxableAmount + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  },

  validate(input: PricingInput): { valid: boolean; error?: string } {
    if (input.quantity < 1) {
      return { valid: false, error: 'Quantity must be at least 1' };
    }
    return { valid: true };
  },
};

/**
 * No discount strategy (standard pricing)
 */
export const standardPricingStrategy: PricingStrategy = {
  name: 'standard',
  description: 'No discount, standard pricing',

  calculate(input: PricingInput): PricingOutput {
    const { basePrice, quantity } = input;
    const subtotal = basePrice * quantity;
    const discount = 0;
    const taxableAmount = subtotal;
    const tax = taxableAmount * (input.taxRate || 0);
    const total = taxableAmount + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: 0,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  },

  validate(): { valid: boolean } {
    return { valid: true };
  },
};

/**
 * Strategy registry for easy access
 */
export const pricingStrategies = {
  percentage_discount: percentageDiscountStrategy,
  fixed_discount: fixedDiscountStrategy,
  tiered_pricing: tieredPricingStrategy,
  standard: standardPricingStrategy,
};

/**
 * Get strategy by name
 */
export function getPricingStrategy(name: string): PricingStrategy | undefined {
  return pricingStrategies[name as keyof typeof pricingStrategies];
}

/**
 * Calculate price using specified strategy
 */
export function calculatePrice(
  input: PricingInput,
  strategyName: keyof typeof pricingStrategies = 'standard'
): PricingOutput {
  const strategy = getPricingStrategy(strategyName);
  if (!strategy) {
    throw new Error(`Unknown pricing strategy: ${strategyName}`);
  }
  return strategy.calculate(input);
}

export default PricingStrategy;
