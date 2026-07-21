'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useCart, CartItem } from './cart-context';
import { useWholesale } from './wholesale-context';
import { api } from '@/lib/api';

export interface WholesaleCartItem extends CartItem {
  moq?: number;
  wholesalePrice?: number;
  tierDiscount?: number;
  bulkDiscount?: number;
  finalPrice?: number;
  moqValid?: boolean;
}

interface CartValidationResult {
  isValid: boolean;
  errors: Array<{
    itemId: string;
    message: string;
    moq?: number;
    currentQuantity?: number;
  }>;
  warnings: Array<{
    itemId: string;
    message: string;
    suggestedQuantity?: number;
  }>;
}

interface BulkDiscount {
  min_quantity: number;
  discount_percent: number;
}

interface WholesaleCartContextType {
  items: WholesaleCartItem[];
  validation: CartValidationResult;
  cartSummary: {
    subtotal: number;
    tierDiscount: number;
    bulkDiscount: number;
    total: number;
    savings: number;
    totalItems: number;
  };
  isWholesaleCart: boolean;
  validateCart: () => Promise<CartValidationResult>;
  addWholesaleItem: (item: WholesaleCartItem) => Promise<boolean>;
  updateWholesaleQuantity: (id: string, quantity: number) => Promise<void>;
  removeWholesaleItem: (id: string) => void;
  clearWholesaleCart: () => void;
}

const WholesaleCartContext = createContext<
  WholesaleCartContextType | undefined
>(undefined);

export function WholesaleCartProvider({ children }: { children: ReactNode }) {
  const {
    items: regularItems,
    addItem: addRegularItem,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();
  const { wholesaleInfo, getPrice } = useWholesale();
  const [items, setItems] = useState<WholesaleCartItem[]>([]);
  const [validation, setValidation] = useState<CartValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  });
  const isWholesaleCart = wholesaleInfo?.hasWholesaleAccess ?? false;

  // Convert regular items to wholesale items with pricing
  useEffect(() => {
    if (!isWholesaleCart) {
      const timer = setTimeout(() => setItems(regularItems), 0);
      return () => clearTimeout(timer);
    }

    const updateWholesaleItems = async () => {
      const updatedItems: WholesaleCartItem[] = [];

      for (const item of regularItems) {
        try {
          // Get MOQ for this variant
          const moqResponse = await api.getWholesaleMOQ(item.variantId);
          const moq = moqResponse.moq || 1;

          // Get bulk discounts
          const discountsResponse = await api.getWholesaleBulkDiscounts(
            item.variantId
          );
          const bulkDiscounts = (discountsResponse.discounts || []) as BulkDiscount[];

          // Calculate pricing
          const priceInfo = getPrice(item.variantId, item.price);
          const basePrice = priceInfo.isWholesale
            ? priceInfo.price
            : item.price;

          // Apply bulk discount if applicable
          let bulkDiscount = 0;
          let finalPrice = basePrice;

          if (
            bulkDiscounts.length > 0 &&
            item.quantity >= bulkDiscounts[0].min_quantity
          ) {
            const applicableDiscount = bulkDiscounts
              .sort((a, b) => b.min_quantity - a.min_quantity)
              .find((discount) => item.quantity >= discount.min_quantity);

            if (applicableDiscount) {
              bulkDiscount = applicableDiscount.discount_percent;
              finalPrice = Math.round(basePrice * (1 - bulkDiscount / 100));
            }
          }

          updatedItems.push({
            ...item,
            moq,
            wholesalePrice: basePrice,
            tierDiscount: priceInfo.isWholesale
              ? wholesaleInfo.discountPercent
              : 0,
            bulkDiscount,
            finalPrice,
            moqValid: item.quantity >= moq,
          });
        } catch (error) {
          console.error(
            `Error processing wholesale item ${item.variantId}:`,
            error
          );
          updatedItems.push({
            ...item,
            moq: 1,
            moqValid: true,
          });
        }
      }

      setItems(updatedItems);
    };

    updateWholesaleItems();
  }, [regularItems, isWholesaleCart, wholesaleInfo, getPrice]);

  const validateCart = async (): Promise<CartValidationResult> => {
    const errors: CartValidationResult['errors'] = [];
    const warnings: CartValidationResult['warnings'] = [];

    for (const item of items) {
      if (isWholesaleCart && item.moq && item.quantity < item.moq) {
        errors.push({
          itemId: item.variantId,
          message: `Minimum order quantity is ${item.moq}`,
          moq: item.moq,
          currentQuantity: item.quantity,
        });
      }
    }

    const result = {
      isValid: errors.length === 0,
      errors,
      warnings,
    };

    setValidation(result);
    return result;
  };

  const addWholesaleItem = async (
    item: WholesaleCartItem
  ): Promise<boolean> => {
    if (!isWholesaleCart) {
      addRegularItem(item);
      return true;
    }

    // Check MOQ
    try {
      const moqResponse = await api.getWholesaleMOQ(item.variantId);
      const moq = moqResponse.moq || 1;

      if (item.quantity < moq) {
        return false;
      }

      addRegularItem(item);
      return true;
    } catch (error) {
      console.error('Error adding wholesale item:', error);
      return false;
    }
  };

  const updateWholesaleQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    if (isWholesaleCart) {
      const item = items.find((i) => i.variantId === id);
      if (item && item.moq && quantity < item.moq) {
        // Don't allow below MOQ
        return;
      }
    }

    updateQuantity(id, quantity);
  };

  const removeWholesaleItem = (id: string) => {
    removeItem(id);
  };

  const clearWholesaleCart = () => {
    clearCart();
  };

  // Calculate cart summary
  const cartSummary = {
    subtotal: items.reduce(
      (acc, item) => acc + (item.finalPrice || item.price) * item.quantity,
      0
    ),
    tierDiscount: items.reduce((acc, item) => {
      if (item.tierDiscount && item.wholesalePrice) {
        const discount = Math.round(
          item.wholesalePrice * (item.tierDiscount / 100)
        );
        return acc + discount * item.quantity;
      }
      return acc;
    }, 0),
    bulkDiscount: items.reduce((acc, item) => {
      if (item.bulkDiscount && item.wholesalePrice) {
        const discount = Math.round(
          item.wholesalePrice * (item.bulkDiscount / 100)
        );
        return acc + discount * item.quantity;
      }
      return acc;
    }, 0),
    total: items.reduce(
      (acc, item) => acc + (item.finalPrice || item.price) * item.quantity,
      0
    ),
    savings: items.reduce((acc, item) => {
      if (item.finalPrice && item.price > item.finalPrice) {
        return acc + (item.price - item.finalPrice) * item.quantity;
      }
      return acc;
    }, 0),
    totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
  };

  return (
    <WholesaleCartContext.Provider
      value={{
        items,
        validation,
        cartSummary,
        isWholesaleCart,
        validateCart,
        addWholesaleItem,
        updateWholesaleQuantity,
        removeWholesaleItem,
        clearWholesaleCart,
      }}
    >
      {children}
    </WholesaleCartContext.Provider>
  );
}

export const useWholesaleCart = () => {
  const context = useContext(WholesaleCartContext);
  if (!context) {
    throw new Error(
      'useWholesaleCart must be used within WholesaleCartProvider'
    );
  }
  return context;
};
