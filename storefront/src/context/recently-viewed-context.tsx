'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { storage } from '@/lib/storage';

export interface RecentlyViewedItem {
  id: string;
  handle: string;
  title: string;
  thumbnail?: string;
  price: number;
  currency: string;
  viewedAt: number;
}

interface RecentlyViewedContextType {
  items: RecentlyViewedItem[];
  addItem: (item: Omit<RecentlyViewedItem, 'viewedAt'>) => void;
  clearItems: () => void;
}

const RecentlyViewedContext = createContext<
  RecentlyViewedContextType | undefined
>(undefined);

const STORAGE_KEY = 'odhvica_recently_viewed';
const MAX_ITEMS = 12;

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = storage.get<RecentlyViewedItem[]>(STORAGE_KEY, []);
    const timer = setTimeout(() => {
      setItems(stored || []);
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      storage.set(STORAGE_KEY, items);
    }
  }, [items, isLoaded]);

  const addItem = (item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      const newItem: RecentlyViewedItem = { ...item, viewedAt: Date.now() };
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
      return updated;
    });
  };

  const clearItems = () => {
    setItems([]);
  };

  return (
    <RecentlyViewedContext.Provider value={{ items, addItem, clearItems }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error(
      'useRecentlyViewed must be used within RecentlyViewedProvider'
    );
  }
  return context;
}
