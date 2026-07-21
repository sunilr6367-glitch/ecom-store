'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { detectUserCurrency } from '@/lib/currency';
import { getSelectableRegions, StoreRegion } from '@/lib/regions';

export type Region = StoreRegion;

interface TaxRate {
  country_code: string;
  rate: number;
  name: string;
}

interface StoreSettings {
  free_shipping_threshold: number;
  currency_code: string;
  store_name: string;
  tax_rates?: TaxRate[];
  default_tax_rate?: number;
}

interface TaxCalculationResult {
  tax_amount: number;
  tax_rate: number;
  tax_name: string;
  currency_code: string;
}

interface ShopContextType {
  currentRegion: Region | null;
  regions: Region[];
  setRegion: (region: Region) => void;
  isLoading: boolean;
  settings: StoreSettings;
  calculateTax: (countryCode: string, subtotal: number) => TaxCalculationResult;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const defaultSettings: StoreSettings = {
  free_shipping_threshold: 250, // $250 default
  currency_code: 'USD',
  store_name: 'Odhvica',
  tax_rates: [
    { country_code: 'US', rate: 0.08, name: 'Sales Tax' },
    { country_code: 'GB', rate: 0.2, name: 'VAT' },
    { country_code: 'CA', rate: 0.13, name: 'HST' },
    { country_code: 'AU', rate: 0.1, name: 'GST' },
    { country_code: 'DE', rate: 0.19, name: 'VAT' },
    { country_code: 'FR', rate: 0.2, name: 'VAT' },
    { country_code: 'IN', rate: 0.18, name: 'GST' },
    { country_code: 'JP', rate: 0.1, name: 'Consumption Tax' },
  ],
  default_tax_rate: 0.1,
};

export function ShopProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch regions and settings in parallel
        const [regionsData, settingsData] = await Promise.all([
          api.getRegions(),
          api.getStoreSettings().catch(() => null), // Don't fail if settings not available
        ]);

        const regionList = getSelectableRegions(regionsData.regions || []);
        setRegions(regionList);

        // Set settings if available - deep merge to preserve defaults
        if (settingsData) {
          const sanitizedSettings = {
            ...settingsData,
            // Use nullish coalescing to preserve 0 values
            tax_rates: settingsData.tax_rates ?? defaultSettings.tax_rates,
            default_tax_rate:
              settingsData.default_tax_rate ?? defaultSettings.default_tax_rate,
            free_shipping_threshold:
              settingsData.free_shipping_threshold ??
              defaultSettings.free_shipping_threshold,
            currency_code:
              settingsData.currency_code ?? defaultSettings.currency_code,
            store_name: settingsData.store_name ?? defaultSettings.store_name,
          };
          setSettings({
            ...defaultSettings,
            ...sanitizedSettings,
            tax_rates: sanitizedSettings.tax_rates,
          });
        }

        // Check localStorage safely
        const stored = storage.get<Region | null>('odhvica_region', null);
        if (stored) {
          const found = regionList.find((r: Region) => r.id === stored.id);
          setCurrentRegion(found || regionList[0] || null);
        } else if (regionList.length > 0) {
          // Auto-detect region from browser locale — no network call needed
          const detectedCurrency = detectUserCurrency().toLowerCase();
          const matched = regionList.find(
            (r: Region) => r.currency_code?.toLowerCase() === detectedCurrency
          );
          setCurrentRegion(matched || regionList[0]);
        }
      } catch (err) {
        console.error('ShopProvider Init Error', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const setRegion = useCallback((region: Region) => {
    setCurrentRegion(region);
    storage.set('odhvica_region', region);
  }, []);

  // Calculate tax using dynamic settings from backend
  const calculateTax = useCallback((
    countryCode: string,
    subtotal: number
  ): TaxCalculationResult => {
    const currentSettings = settings || defaultSettings;
    const taxRates = currentSettings.tax_rates || defaultSettings.tax_rates!;
    const defaultRate =
      currentSettings.default_tax_rate || defaultSettings.default_tax_rate!;

    // Find tax rate for the country
    const taxRate = taxRates.find((tr) => tr.country_code === countryCode);
    const rate = taxRate ? taxRate.rate : defaultRate;
    let taxName: string;
    if (taxRate) {
      taxName = taxRate.name;
    } else {
      taxName = countryCode === 'US' ? 'Sales Tax' : 'VAT';
    }

    const taxAmount = Math.round(subtotal * rate);

    return {
      tax_amount: taxAmount,
      tax_rate: rate,
      tax_name: taxName,
      currency_code: currentSettings.currency_code || 'USD',
    };
  }, [settings]);

  const contextValue = useMemo(() => ({
    currentRegion,
    regions,
    setRegion,
    isLoading,
    settings,
    calculateTax,
  }), [currentRegion, regions, setRegion, isLoading, settings, calculateTax]);

  return (
    <ShopContext.Provider value={contextValue}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
