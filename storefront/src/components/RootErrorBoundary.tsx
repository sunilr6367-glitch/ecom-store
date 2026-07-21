'use client';

import { usePathname } from 'next/navigation';
import { ErrorBoundary } from './ErrorBoundary';
import { type ReactNode } from 'react';

/**
 * Root-level ErrorBoundary that resets automatically on navigation.
 * Wraps the full app in layout.tsx.
 */
export function RootErrorBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}
