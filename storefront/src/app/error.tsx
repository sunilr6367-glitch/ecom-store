'use client';

import { useEffect } from 'react';
import { Button, ButtonLink, EmptyState } from '@/design-system';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-parchment px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <EmptyState
        eyebrow={error.digest ? `Error ID: ${error.digest}` : 'Oops'}
        title="Something went wrong"
        description="We apologize for the inconvenience. An unexpected error has occurred. Our team has been notified and we're working to fix it."
        className="max-w-2xl"
        actions={
          <>
            <Button onClick={reset} variant="secondary" size="lg">
             Try Again
            </Button>
            <ButtonLink
              href="/"
              variant="outline"
              size="lg"
            >
              Go Home
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
