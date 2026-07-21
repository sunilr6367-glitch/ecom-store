'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { CountrySelect, Input } from '@/design-system';
import { storefrontTrust } from '@/config/storefront-trust';
import { api } from '@/lib/api';
import { useShop } from '@/context/shop-context';
import styles from './pdp.module.css';


type ShippingOption = {
  id: string;
  name: string;
  description?: string;
  price: number;
  estimated_days?: string;
  currency_code?: string;
};

function formatShippingPrice(amount: number, currencyCode?: string) {
  const currency = currencyCode?.toUpperCase() || 'INR';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export default function ProductDeliveryPlanner() {
  const { currentRegion } = useShop();
  const [countryCode, setCountryCode] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [serviceabilityMessage, setServiceabilityMessage] = useState('');

  useEffect(() => {
    if (!countryCode && currentRegion?.currency_code?.toLowerCase() === 'inr') {
      setCountryCode('IN');
    }
  }, [countryCode, currentRegion?.currency_code]);

  useEffect(() => {
    let cancelled = false;

    const fetchShippingPreview = async () => {
      if (!countryCode) {
        setShippingOptions([]);
        return;
      }

      setShippingLoading(true);
      try {
        const data = await api.getShippingOptions(
          countryCode,
          currentRegion?.id,
          postalCode
        );
        if (!cancelled) {
          setShippingOptions(data.options || []);
          setServiceabilityMessage(data.serviceability?.message || '');
        }
      } catch {
        if (!cancelled) {
          setShippingOptions([]);
          setServiceabilityMessage('');
        }
      } finally {
        if (!cancelled) {
          setShippingLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchShippingPreview, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [countryCode, currentRegion?.id, postalCode]);

  const plannerSummary = useMemo(() => {
    if (!countryCode) {
      return 'Select your country to preview likely shipping methods before checkout.';
    }

    if (shippingLoading) {
      return 'Loading country-level shipping options...';
    }

    if (shippingOptions.length === 0) {
      return 'We will confirm final courier availability after your full address is entered at checkout.';
    }

    return `${shippingOptions.length} shipping method${shippingOptions.length > 1 ? 's' : ''} currently available for this destination preview.`;
  }, [countryCode, shippingLoading, shippingOptions.length]);

  return (
    <div className="soft-card mt-4">
      <strong className={styles['pdp-trust-label']}>Delivery planning</strong>
      <p className={[styles['pdp-trust-sublabel'], 'mt-2'].filter(Boolean).join(' ')}>
        Preview country-level shipping methods before checkout. Final courier
        availability, delivery timing, and charges are confirmed after full
        address entry.
      </p>

      <div
        className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4"
      >
        <div>
          <p className={[styles['pdp-trust-sublabel'], 'mb-2'].filter(Boolean).join(' ')}>
            Delivery country
          </p>
          <CountrySelect
            name="country"
            value={countryCode}
            onChange={setCountryCode}
          />
        </div>
        <div>
          <Input
            id="pdp-postal-code"
            type="text"
            label="Postal code"
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
            placeholder="Add for checkout readiness"
          />
        </div>
      </div>

      <p className={[styles['pdp-trust-sublabel'], 'mt-3'].filter(Boolean).join(' ')}>
        {serviceabilityMessage || plannerSummary}
      </p>

      {shippingOptions.length > 0 ? (
        <div
          className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3"
        >
          {shippingOptions.slice(0, 3).map((option) => (
            <div
              key={option.id}
              className="rounded-lg border border-border-subtle bg-surface-paper p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-body-sm font-medium text-primary">
                    {option.name}
                  </p>
                  {option.description ? (
                    <p className="mt-1 text-body-xs text-muted">
                      {option.description}
                    </p>
                  ) : null}
                </div>
                <p className="text-body-sm font-medium text-primary">
                  {option.price === 0
                    ? 'Free'
                    : formatShippingPrice(option.price, option.currency_code)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className={[styles['option-row'], 'mt-3'].filter(Boolean).join(' ')}>
        <Link href={storefrontTrust.policyRoutes.shipping} className={styles['pdp-link-button']}>
          Shipping Policy
        </Link>
        <Link href="/checkout" className={styles['pdp-link-button']}>
          Continue to Checkout
        </Link>
      </div>
    </div>
  );
}
