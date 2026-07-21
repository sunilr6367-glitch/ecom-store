'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button, ButtonLink, EmptyState } from '@/design-system';

export default function ProductsError({
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
          href="/"
          className="error-back-link mb-8 inline-flex items-center gap-2 transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <EmptyState
          eyebrow={error.digest ? `Error ID: ${error.digest}` : undefined}
          title="Unable to Load Products"
          description="We're having trouble loading the products right now. Please try again in a moment."
          className="mx-auto max-w-2xl"
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
                href="/"
                variant="outline"
                size="lg"
              >
                Browse Homepage
              </ButtonLink>
            </>
          }
        />
      </div>
    </div>
  );
}
