'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { storage } from '@/lib/storage';
import { useAuth } from './auth-context';
import { api } from '@/lib/api';
import { getCanonicalProductHandle } from '@/lib/product-links';

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  title: string;
  price: number;
  currency: string;
  thumbnail?: string;
  material?: string;
  origin?: string;
  sku?: string;
  description?: string;
  handle?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  cartTotal: number;
  savedCartCount: number;
  cartError: string | null;
  recoverSavedCart: () => Promise<void>;
  dismissSavedCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function sanitizeCartItem(item: CartItem): CartItem {
  return {
    ...item,
    handle: getCanonicalProductHandle(item.handle),
  };
}

function sanitizeCartItems(items: CartItem[] | null | undefined): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items.map(sanitizeCartItem);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [savedCartCount, setSavedCartCount] = useState(0);
  const [recoveryOffered, setRecoveryOffered] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const { customer } = useAuth();

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = sanitizeCartItems(
        storage.get<CartItem[]>('odhvica_cart', [])
      );
      const timer = setTimeout(() => {
        if (stored && stored.length > 0) {
          setItems(stored);
        }
        setIsLoaded(true);
      }, 0);
      return () => clearTimeout(timer);
    } catch {
      setTimeout(() => {
        setCartError('Unable to load your cart. Please refresh the page.');
        setIsLoaded(true);
      }, 0);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      storage.set('odhvica_cart', items);
    }
  }, [items, isLoaded]);

  // Save cart to backend when user is logged in and cart changes
  useEffect(() => {
    if (!customer || !isLoaded) return;

    const timeout = setTimeout(() => {
      if (items.length === 0) {
        // Clear saved cart only when we know there's no saved cart to recover
        // or when recovery has already been offered/dismissed
        if (savedCartCount === 0 || !recoveryOffered) {
          api.clearSavedCart().catch(console.error);
        }
      } else {
        api.saveCart(items).catch(console.error);
      }
    }, 1000); // Debounce 1 second
    return () => clearTimeout(timeout);
  }, [items, customer, isLoaded, savedCartCount, recoveryOffered]);

  // Check for saved cart when user logs in
  useEffect(() => {
    if (customer && isLoaded) {
      api
        .getSavedCart()
        .then((data) => {
          if (data.items && data.items.length > 0) {
            setSavedCartCount(data.items.length);
            setRecoveryOffered(true);
          } else {
            setSavedCartCount(0);
          }
        })
        .catch(() => {
          setSavedCartCount(0);
          setCartError('Unable to load your cart. Please refresh the page.');
        });
    }
  }, [customer, isLoaded]);

  // Clear saved cart count when user logs out
  useEffect(() => {
    if (!customer && isLoaded) {
      const timer = setTimeout(() => {
        setSavedCartCount(0);
        setRecoveryOffered(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [customer, isLoaded]);

  const recoverSavedCart = useCallback(async () => {
    try {
      const data = await api.getSavedCart();
      if (data.items && data.items.length > 0) {
        // Merge saved cart with current cart - immutable updates
        setItems((prev) => {
          const merged = [...prev];
          sanitizeCartItems(data.items).forEach((savedItem: CartItem) => {
            const existingIndex = merged.findIndex(
              (i) => i.variantId === savedItem.variantId
            );
            if (existingIndex >= 0) {
              // Update existing item with new quantity (create new object)
              merged[existingIndex] = {
                ...merged[existingIndex],
                quantity: merged[existingIndex].quantity + savedItem.quantity,
              };
            } else {
              // Add new item (create new object)
              merged.push({ ...savedItem });
            }
          });
          return merged;
        });
        setSavedCartCount(0);
        setRecoveryOffered(false);
        // Clear saved cart from backend after recovery
        await api.clearSavedCart();
      }
    } catch (error) {
      console.error('Failed to recover cart:', error);
    }
  }, []);

  const dismissSavedCart = useCallback(() => {
    setSavedCartCount(0);
    setRecoveryOffered(false);
    api.clearSavedCart().catch(console.error);
  }, []);

  const addItem = (newItem: CartItem) => {
    const sanitizedItem = sanitizeCartItem(newItem);
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === sanitizedItem.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === sanitizedItem.variantId
            ? { ...i, quantity: i.quantity + sanitizedItem.quantity }
            : i
        );
      }
      return [...prev, sanitizedItem];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.variantId === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        cartTotal,
        savedCartCount,
        cartError,
        recoverSavedCart,
        dismissSavedCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
