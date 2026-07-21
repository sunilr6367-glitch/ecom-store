'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface WholesaleInfo {
  hasWholesaleAccess: boolean;
  tier: string | null;
  companyName: string | null;
  discountPercent: number;
}

interface WholesalePrice {
  variantId: string;
  retailPrice: number;
  wholesalePrice: number;
  discountPercent: number;
  savings: number;
}

interface WholesaleContextType {
  wholesaleInfo: WholesaleInfo;
  prices: Map<string, WholesalePrice>;
  loading: boolean;
  refreshPricing: () => Promise<void>;
  getPrice: (
    variantId: string,
    retailPrice: number
  ) => { price: number; isWholesale: boolean; savings: number };
  fetchPrices: (variantIds: string[]) => Promise<void>;
}

const WholesaleContext = createContext<WholesaleContextType>(
  {} as WholesaleContextType
);

export function WholesaleProvider({ children }: { children: React.ReactNode }) {
  const [wholesaleInfo, setWholesaleInfo] = useState<WholesaleInfo>({
    hasWholesaleAccess: false,
    tier: null,
    companyName: null,
    discountPercent: 0,
  });
  const [prices, setPrices] = useState<Map<string, WholesalePrice>>(new Map());
  const [loading, setLoading] = useState(true);

  const refreshPricing = async () => {
    try {
      setLoading(true);
      const info = await api.getWholesalePricing();

      if (info.hasWholesaleAccess && info.tier) {
        setWholesaleInfo({
          hasWholesaleAccess: true,
          tier: info.tier,
          companyName: info.companyName || null,
          discountPercent: info.discountPercent || 0,
        });
      } else {
        setWholesaleInfo({
          hasWholesaleAccess: false,
          tier: null,
          companyName: null,
          discountPercent: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching wholesale pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async (variantIds: string[]) => {
    if (!wholesaleInfo.hasWholesaleAccess || variantIds.length === 0) return;

    try {
      const result = await api.getWholesalePrices(variantIds);
      if (result.prices) {
        const newPrices = new Map(prices);
        result.prices.forEach((p: WholesalePrice) => {
          newPrices.set(p.variantId, p);
        });
        setPrices(newPrices);
      }
    } catch (error) {
      console.error('Error fetching wholesale prices:', error);
    }
  };

  const getPrice = (variantId: string, retailPrice: number) => {
    const wholesalePrice = prices.get(variantId);

    if (wholesalePrice && wholesalePrice.wholesalePrice < retailPrice) {
      return {
        price: wholesalePrice.wholesalePrice,
        isWholesale: true,
        savings: wholesalePrice.savings,
      };
    }

    // Calculate from tier discount if no explicit wholesale price
    if (wholesaleInfo.hasWholesaleAccess && wholesaleInfo.tier) {
      const discount = wholesaleInfo.discountPercent || 0;
      const wholesalePriceValue = Math.round(
        retailPrice * (1 - discount / 100)
      );
      return {
        price: wholesalePriceValue,
        isWholesale: true,
        savings: retailPrice - wholesalePriceValue,
      };
    }

    return {
      price: retailPrice,
      isWholesale: false,
      savings: 0,
    };
  };

  useEffect(() => {
    refreshPricing();
  }, []);

  return (
    <WholesaleContext.Provider
      value={{
        wholesaleInfo,
        prices,
        loading,
        refreshPricing,
        getPrice,
        fetchPrices,
      }}
    >
      {children}
    </WholesaleContext.Provider>
  );
}

export const useWholesale = () => useContext(WholesaleContext);
