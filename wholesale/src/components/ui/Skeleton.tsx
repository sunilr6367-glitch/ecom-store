'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded bg-surface-warm', className)}
    />
  );
}

// Product card skeleton
export function ProductCardSkeleton() {
  return (
    <div className="bg-[var(--ds-surface-paper)]">
      {/* Image skeleton */}
      <div className="relative mb-4 aspect-[3/4] overflow-hidden bg-surface-soft">
        <Skeleton className="absolute inset-0" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-1/3 mt-2" />
      </div>
    </div>
  );
}

// Product grid skeleton
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[var(--ds-space-sm)] md:gap-[var(--ds-space-md)]">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Product detail skeleton
export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--ds-surface-paper)] py-[var(--ds-space-xl)] md:py-[var(--ds-space-2xl)] lg:py-[var(--ds-space-3xl)]">
      <div className="kv-page-container mx-auto max-w-page">
        {/* Breadcrumb skeleton */}
        <Skeleton className="h-4 w-64 mb-8" />

        <div className="grid gap-[var(--ds-space-md)] md:grid-cols-2 md:gap-[var(--ds-space-lg)] lg:gap-[var(--ds-space-lg)]">
          {/* Left: Image Gallery skeleton */}
          <div className="aspect-square bg-surface-soft">
            <Skeleton className="w-full h-full" />
          </div>

          {/* Right: Details skeleton */}
          <div className="space-y-6">
            {/* Collection tag */}
            <Skeleton className="h-3 w-32" />

            {/* Title */}
            <Skeleton className="h-12 w-3/4" />

            {/* Price */}
            <Skeleton className="h-8 w-1/3" />

            {/* Description */}
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Variant selector */}
            <div className="pt-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <div className="flex gap-[var(--ds-space-xs)]">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>

            {/* Add to cart */}
            <div className="flex gap-[var(--ds-space-sm)] pt-[var(--ds-space-sm)]">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 flex-1" />
            </div>

            {/* Trust badges */}
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cart page skeleton
export function CartSkeleton() {
  return (
    <div className="min-h-screen bg-surface py-[var(--ds-space-xl)] md:py-[var(--ds-space-2xl)] lg:py-[var(--ds-space-3xl)]">
      <div className="kv-page-container mx-auto max-w-page">
        <Skeleton className="h-10 w-64 mb-8" />

        <div className="grid lg:grid-cols-12 gap-[var(--ds-space-md)]">
          {/* Cart items */}
          <div className="lg:col-span-7 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 bg-[var(--ds-surface-paper)] p-4">
                <Skeleton className="w-24 h-24 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-5">
            <div className="space-y-4 bg-[var(--ds-surface-paper)] p-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-12 w-full mt-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Checkout page skeleton
export function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-surface py-[var(--ds-space-xl)] md:py-[var(--ds-space-2xl)] lg:py-[var(--ds-space-3xl)]">
      <div className="kv-page-container mx-auto max-w-page">
        <Skeleton className="h-10 w-64 mb-8" />

        <div className="grid gap-[var(--ds-space-md)] lg:grid-cols-2 lg:gap-[var(--ds-space-lg)]">
          {/* Shipping form */}
          <div className="space-y-6">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-2 gap-[var(--ds-space-sm)]">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <div className="grid grid-cols-2 gap-[var(--ds-space-sm)]">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
            <Skeleton className="h-12" />
          </div>

          {/* Order summary */}
          <div className="space-y-4 bg-[var(--ds-surface-paper)] p-6">
            <Skeleton className="h-6 w-32" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-[var(--ds-space-sm)]">
                <Skeleton className="w-16 h-16 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
            <Skeleton className="h-px w-full my-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Account page skeleton
export function AccountSkeleton() {
  return (
    <div className="min-h-screen bg-surface py-[var(--ds-space-xl)] md:py-[var(--ds-space-2xl)] lg:py-[var(--ds-space-3xl)]">
      <div className="kv-page-container mx-auto max-w-page">
        <Skeleton className="h-10 w-64 mb-8" />

        <div className="flex flex-col lg:flex-row gap-[var(--ds-space-md)]">
          {/* Sidebar */}
          <div className="lg:w-64 shrink-0">
            <div className="space-y-4 bg-[var(--ds-surface-paper)] p-6">
              <Skeleton className="w-16 h-16 rounded-[var(--ds-radius-pill)] mx-auto" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-3 w-1/2 mx-auto" />
              <Skeleton className="h-px w-full my-4" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-6">
            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-[var(--ds-space-sm)]">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 bg-[var(--ds-surface-paper)] p-6">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>

            {/* Recent orders */}
            <div className="bg-[var(--ds-surface-paper)] p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between py-[var(--ds-space-sm)] border-b">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Orders list skeleton
export function OrdersListSkeleton() {
  return (
    <div className="min-h-screen bg-surface py-[var(--ds-space-xl)] md:py-[var(--ds-space-2xl)] lg:py-[var(--ds-space-3xl)]">
      <div className="mx-auto max-w-4xl">
        <Skeleton className="h-10 w-64 mb-8" />

        <div className="bg-[var(--ds-surface-paper)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-[var(--ds-space-md)] border-b"
            >
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Generic text skeleton for content
export function TextSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

// Hero section skeleton
export function HeroSkeleton() {
  return (
    <div className="relative flex min-h-[70vh] items-center bg-surface-soft">
      <div className="kv-page-container mx-auto w-full max-w-page py-[var(--ds-space-xl)] md:py-[var(--ds-space-2xl)] lg:py-[var(--ds-space-3xl)]">
        <div className="max-w-2xl space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-12 w-48 mt-8" />
        </div>
      </div>
    </div>
  );
}

// Collection card skeleton
export function CollectionCardSkeleton() {
  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-surface-soft">
      <Skeleton className="absolute inset-0" />
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.60)] to-transparent">
        <Skeleton className="h-6 w-3/4 bg-[rgba(var(--ds-cream-rgb),0.5)]" />
        <Skeleton className="mt-2 h-4 w-1/2 bg-[rgba(var(--ds-cream-rgb),0.3)]" />
      </div>
    </div>
  );
}
