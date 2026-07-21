/**
 * Safe LocalStorage Utility
 * Prevents SSR errors by checking for browser environment
 */

export const storage = {
  /**
   * Get item from localStorage
   * @param key - Storage key
   * @param defaultValue - Default value if key not found
   * @returns Parsed value or defaultValue
   */
  get: <T>(key: string, defaultValue: T | null = null): T | null => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Storage get error for key "${key}":`, e);
      return defaultValue;
    }
  },

  /**
   * Set item in localStorage
   * @param key - Storage key
   * @param value - Value to store (will be JSON stringified)
   */
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Storage set error for key "${key}":`, e);
    }
  },

  /**
   * Remove item from localStorage
   * @param key - Storage key to remove
   */
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Storage remove error for key "${key}":`, e);
    }
  },

  /**
   * Clear all items from localStorage
   */
  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Storage clear error:', e);
    }
  },
};

/**
 * Hook for safe localStorage with state synchronization
 * Usage: const [value, setValue] = useLocalStorage('key', defaultValue);
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Initialize state with value from localStorage or initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    return storage.get<T>(key, initialValue) ?? initialValue;
  });

  // Update localStorage when state changes
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      storage.set(key, valueToStore);
    } catch (e) {
      console.error(`useLocalStorage error for key "${key}":`, e);
    }
  };

  return [storedValue, setValue];
}

// Import useState for the hook
import { useState } from 'react';
