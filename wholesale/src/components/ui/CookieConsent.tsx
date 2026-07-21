'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';
import { ConsentManager } from '@/lib/consent-manager';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // only show banner when there is no stored consent
    const existing = ConsentManager.getConsent();
    if (!existing) {
      // Give the first brand viewport a moment before asking for consent.
      const timer = setTimeout(() => setShowBanner(true), 3200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    ConsentManager.acceptAll();
    setShowBanner(false);
    // reload page so any scripts depending on consent can initialize
    window.location.reload();
  };

  const handleRejectAll = () => {
    ConsentManager.rejectAll();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      className="cookie-consent fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 animate-fade-in-up md:bottom-6 md:left-auto md:right-6 md:max-w-md"
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <Card className="cookie-consent-card flex flex-col gap-[var(--ds-space-xs)] rounded-[var(--radius-sm)] p-[var(--ds-space-xs)] shadow-xl md:gap-4 md:p-5 md:shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-[var(--ds-space-xs)]">
          <div className="flex min-w-0 items-start gap-2.5">
            <Cookie
              size={20}
              className="mt-0.5 shrink-0 text-[var(--ds-accent-gold)]"
            />
            <div className="min-w-0">
              <p className="text-body-sm text-primary font-semibold">
                We value your privacy
              </p>
              <p className="mt-0.5 text-body-xs leading-token-relaxed text-muted font-light">
                Choose which categories of cookies & tracking you allow.{' '}
                <Link
                  href="/pages/privacy-policy"
                  className="text-primary underline underline-offset-2 transition-colors hover:text-accent"
                >
                  Learn more
                </Link>
              </p>
            </div>
          </div>
          <IconButton
            onClick={handleRejectAll}
            aria-label="Dismiss"
            size="sm"
            variant="ghost"
            className="-mr-1 -mt-1 shrink-0 text-muted hover:text-primary"
          >
            <X size={16} />
          </IconButton>
        </div>

        {/* Actions */}
        <div className="cookie-consent-actions grid grid-cols-2 gap-[var(--ds-space-xs)] sm:flex sm:items-center">
          <Button
            onClick={handleAcceptAll}
            variant="secondary"
            size="sm"
            className="min-h-10 flex-1 whitespace-nowrap bg-[var(--ds-text-primary)] text-inverse"
          >
            Accept All
          </Button>
          <Button
            onClick={handleRejectAll}
            variant="outline"
            size="sm"
            className="min-h-10 flex-1 whitespace-nowrap"
          >
            Reject All
          </Button>
          <Link
            href="/cookie-settings"
            className="col-span-2 flex min-h-9 flex-1 items-center justify-center text-center text-body-xs tracking-token-wider text-primary underline transition-colors font-bold hover:text-accent sm:col-span-1"
          >
            Customize
          </Link>
        </div>
      </Card>
    </div>
  );
}

