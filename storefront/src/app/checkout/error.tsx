'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw, ShoppingBag } from 'lucide-react';
import { storefrontTrust } from '@/config/storefront-trust';
import { Button, ButtonLink, EmptyState, StatusBanner } from '@/design-system';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-parchment py-[var(--ds-space-xl)] md:py-[var(--ds-space-2xl)] lg:py-[var(--ds-space-3xl)]">
      <div className="ds-page-container mx-auto max-w-page">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-muted hover:text-primary mb-8 text-body-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Cart
        </Link>

        <div className="mx-auto max-w-2xl">
          <EmptyState
            icon={<ShoppingBag size={48} />}
            eyebrow={error.digest ? `Error ID: ${error.digest}` : undefined}
            title="Checkout Error"
            description="We're sorry, but we encountered an issue processing your checkout. Your cart items are still saved. Please try again, and contact support if the problem persists."
            actions={
              <>
                <Button
                  onClick={reset}
                  variant="secondary"
                  size="lg"
                  leadingIcon={<RefreshCw size={16} />}
                >
                  Try Again
                </Button>
                <ButtonLink
                  href="/cart"
                  variant="outline"
                  size="lg"
                >
                  Return to Cart
                </ButtonLink>
              </>
            }
          />

          <StatusBanner title="Need help before retrying?" className="mt-6">
            <p>
              If you are unsure whether a payment was charged, use payment help
              or contact support before placing another attempt.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-body-xs  tracking-token-wider">
              <Link
                href={storefrontTrust.policyRoutes.paymentHelp}
                className="underline underline-offset-4"
              >
                Payment Help
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.contact}
                className="underline underline-offset-4"
              >
                Contact Support
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.track}
                className="underline underline-offset-4"
              >
                Track Order
              </Link>
            </div>
          </StatusBanner>
        </div>
      </div>
    </div>
  );
}
