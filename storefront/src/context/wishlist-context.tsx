'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { storage } from '@/lib/storage';
import { api } from '@/lib/api';
import { useShop } from '@/context/shop-context';
import { useAuth } from '@/context/auth-context';

export interface WishlistItem {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  price: number;
  currency: string;
  thumbnail?: string;
  handle: string;
  addedAt: number;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleItem: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => void;
  clearWishlist: () => void;
  totalItems: number;
}

interface BackendWishlistEntry {
  id: string;
  product_id: string;
  variant_id?: string;
  created_at: string;
  product?: {
    title?: string;
    thumbnail?: string;
    handle?: string;
    variants?: Array<{
      prices?: Array<{
        amount?: number;
      }>;
    }>;
  };
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { currentRegion } = useShop();
  const { customer, loading: authLoading } = useAuth();
  const customerId = customer?.id;

  // Load from localStorage on mount, then try backend sync
  useEffect(() => {
    const stored = storage.get<WishlistItem[]>('odhvica_wishlist', []);
    const timer = setTimeout(async () => {
      // 1. Load localStorage first (instant)
      if (stored && stored.length > 0) {
        setItems(stored);
      }
      setIsLoaded(true);

      // 2. Try backend sync only for known logged-in users.
      if (authLoading || !customerId) {
        return;
      }

      try {
        const data = await api.getWishlist();
        if (data.wishlist && data.wishlist.length > 0) {
          // Backend wishlist takes precedence when logged in
          const backendItems: WishlistItem[] = data.wishlist.map(
            (w: BackendWishlistEntry) => ({
              id: `wishlist-${w.id}`,
              productId: w.product_id,
              variantId: w.variant_id,
              title: w.product?.title || '',
              price: w.product?.variants?.[0]?.prices?.[0]?.amount || 0,
              currency: currentRegion?.currency_code?.toUpperCase() || 'USD',
              thumbnail: w.product?.thumbnail || undefined,
              handle: w.product?.handle || w.product_id,
              addedAt: new Date(w.created_at).getTime(),
            })
          );
          setItems(backendItems);
          storage.set('odhvica_wishlist', backendItems);
        }
      } catch {
        // Not logged in or backend unavailable — localStorage is fine
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [authLoading, currentRegion?.currency_code, customerId]);

  // Save to localStorage when items change
  useEffect(() => {
    if (isLoaded) {
      storage.set('odhvica_wishlist', items);
    }
  }, [items, isLoaded]);

  const addItem = useCallback(
    (newItem: Omit<WishlistItem, 'id' | 'addedAt'>) => {
      setItems((prev) => {
        if (prev.some((item) => item.productId === newItem.productId))
          return prev;
        const item: WishlistItem = {
          ...newItem,
          id: `wishlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          addedAt: Date.now(),
        };
        // Sync to backend (non-blocking, silent fail for guests)
        api.addToWishlist(newItem.productId, newItem.variantId).catch(() => {});
        return [...prev, item];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    // Sync to backend (non-blocking, silent fail for guests)
    api.removeFromWishlist(productId).catch(() => {});
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.productId === productId);
  };

  const toggleItem = (item: Omit<WishlistItem, 'id' | 'addedAt'>) => {
    if (items.some((i) => i.productId === item.productId)) {
      removeItem(item.productId);
    } else {
      addItem(item);
    }
  };

  const clearWishlist = () => setItems([]);

  const totalItems = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        isInWishlist,
        toggleItem,
        clearWishlist,
        totalItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};
