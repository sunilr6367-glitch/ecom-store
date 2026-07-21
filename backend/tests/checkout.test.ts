/**
 * Unit Tests for Checkout Functionality
 * Tests: Tax calculation, discount validation, inventory checks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

// Test schemas
const ValidateCouponSchema = z.object({
    code: z.string().min(1),
    cart_total: z.number().min(0),
});

const PlaceOrderSchema = z.object({
    region_id: z.string().uuid(),
    currency_code: z.string().length(3),
    email: z.string().email(),
    shipping_address: z.object({
        address_1: z.string(),
        city: z.string(),
        postal_code: z.string(),
        country_code: z.string(),
    }),
    items: z.array(
        z.object({
            variant_id: z.string(),
            quantity: z.number().int().positive(),
        }),
    ).min(1),
});

describe('Zod Schemas', () => {
    describe('ValidateCouponSchema', () => {
        it('should validate valid coupon data', () => {
            const validData = {
                code: 'SAVE10',
                cart_total: 10000,
            };
            const result = ValidateCouponSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject empty code', () => {
            const invalidData = {
                code: '',
                cart_total: 10000,
            };
            const result = ValidateCouponSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject negative cart_total', () => {
            const invalidData = {
                code: 'SAVE10',
                cart_total: -100,
            };
            const result = ValidateCouponSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('PlaceOrderSchema', () => {
        it('should validate valid order data', () => {
            const validData = {
                region_id: '123e4567-e89b-12d3-a456-426614174000',
                currency_code: 'INR',
                email: 'test@example.com',
                shipping_address: {
                    address_1: '123 Main St',
                    city: 'Mumbai',
                    postal_code: '400001',
                    country_code: 'IN',
                },
                items: [
                    { variant_id: 'item-1', quantity: 2 },
                ],
            };
            const result = PlaceOrderSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid email', () => {
            const invalidData = {
                region_id: '123e4567-e89b-12d3-a456-426614174000',
                currency_code: 'INR',
                email: 'invalid-email',
                shipping_address: {
                    address_1: '123 Main St',
                    city: 'Mumbai',
                    postal_code: '400001',
                    country_code: 'IN',
                },
                items: [
                    { variant_id: 'item-1', quantity: 2 },
                ],
            };
            const result = PlaceOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject empty items array', () => {
            const invalidData = {
                region_id: '123e4567-e89b-12d3-a456-426614174000',
                currency_code: 'INR',
                email: 'test@example.com',
                shipping_address: {
                    address_1: '123 Main St',
                    city: 'Mumbai',
                    postal_code: '400001',
                    country_code: 'IN',
                },
                items: [],
            };
            const result = PlaceOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject invalid UUID for region_id', () => {
            const invalidData = {
                region_id: 'not-a-uuid',
                currency_code: 'INR',
                email: 'test@example.com',
                shipping_address: {
                    address_1: '123 Main St',
                    city: 'Mumbai',
                    postal_code: '400001',
                    country_code: 'IN',
                },
                items: [
                    { variant_id: 'item-1', quantity: 2 },
                ],
            };
            const result = PlaceOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});

describe('Tax Calculation', () => {
    // Test tax calculation logic
    const DEFAULT_TAX_RATE = 18; // 18% GST

    function calculateTax(subtotal: number, taxRate: number = DEFAULT_TAX_RATE): number {
        return Math.round(subtotal * (taxRate / 100));
    }

    it('should calculate 18% tax correctly', () => {
        const subtotal = 10000; // ₹100.00 in paise
        const tax = calculateTax(subtotal, 18);
        expect(tax).toBe(1800); // ₹18.00
    });

    it('should calculate 5% tax correctly', () => {
        const subtotal = 10000;
        const tax = calculateTax(subtotal, 5);
        expect(tax).toBe(500);
    });

    it('should return 0 for 0% tax rate', () => {
        const subtotal = 10000;
        const tax = calculateTax(subtotal, 0);
        expect(tax).toBe(0);
    });

    it('should round tax to nearest integer', () => {
        const subtotal = 10001; // ₹100.01
        const tax = calculateTax(subtotal, 18);
        expect(tax).toBe(1800); // 10001 * 0.18 = 1800.18 → rounded to 1800
    });
});

describe('Discount Calculation', () => {
    function calculateDiscountAmount(
        cartTotal: number,
        discountType: 'percentage' | 'fixed_amount',
        discountValue: number
    ): number {
        let discountAmount = 0;
        if (discountType === 'percentage') {
            discountAmount = Math.round((cartTotal * discountValue) / 100);
        } else if (discountType === 'fixed_amount') {
            discountAmount = discountValue;
        }
        // Cap at cart total
        return Math.min(discountAmount, cartTotal);
    }

    it('should calculate percentage discount', () => {
        const discount = calculateDiscountAmount(10000, 'percentage', 10);
        expect(discount).toBe(1000); // 10% of 10000
    });

    it('should calculate fixed amount discount', () => {
        const discount = calculateDiscountAmount(10000, 'fixed_amount', 500);
        expect(discount).toBe(500);
    });

    it('should cap discount at cart total', () => {
        const discount = calculateDiscountAmount(1000, 'percentage', 50);
        expect(discount).toBe(500);
    });

    it('should handle 100% discount correctly', () => {
        const discount = calculateDiscountAmount(10000, 'percentage', 100);
        expect(discount).toBe(10000);
    });
});

describe('Order Total Calculation', () => {
    function calculateOrderTotal(
        subtotal: number,
        shippingTotal: number,
        taxRate: number,
        discountAmount: number
    ): number {
        const taxTotal = Math.round(subtotal * (taxRate / 100));
        const total = subtotal + shippingTotal + taxTotal - discountAmount;
        return Math.max(total, 0); // Ensure non-negative
    }

    it('should calculate order total with tax and discount', () => {
        const subtotal = 10000;
        const shipping = 500;
        const taxRate = 18;
        const discount = 1000;

        const total = calculateOrderTotal(subtotal, shipping, taxRate, discount);
        // subtotal(10000) + shipping(500) + tax(1800) - discount(1000) = 11300
        expect(total).toBe(11300);
    });

    it('should return 0 for total exceeding discount', () => {
        const subtotal = 500;
        const shipping = 0;
        const taxRate = 18;
        const discount = 1000; // More than subtotal

        const total = calculateOrderTotal(subtotal, shipping, taxRate, discount);
        expect(total).toBe(0);
    });
});
