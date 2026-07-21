
import { Heading } from '@/design-system';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Gift, Layers3, Sparkles, Tags, Wand2 } from 'lucide-react';

import { storefrontTrust } from '@/config/storefront-trust';
import { buildBasicPageMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { cardClasses } from '@/design-system';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Curated Edits | Odhvica',
  description:
    'Browse curated Odhvica edits for gifting, bestsellers, new arrivals, block prints, sale picks, and collection-led discovery.',
  path: '/edits',
  keywords: [
    'Odhvica curated edits',
    'gift guide',
    'bestsellers',
    'block print edit',
  ],
});

const editCards = [
  {
    title: 'Gift Edit',
    copy:
      'Start with gift-friendly picks and easy browsing paths for thoughtful premium gifting.',
    href: '/collections/gifts-under-2000',
    icon: Gift,
    accent: 'from-[var(--ds-accent-hover)] via-[var(--ds-accent-primary)] to-[var(--ds-accent-soft)]',
  },
  {
    title: 'Block Print Edit',
    copy:
      'Jump into handcrafted block-print styles instead of starting from the full catalog.',
    href: '/collections/block-print-edit',
    icon: Wand2,
    accent: 'from-[var(--ds-success-text)] via-[var(--ds-success)] to-[var(--ds-success-bg)]',
  },
  {
    title: 'Bestsellers',
    copy:
      'Browse the pieces that already carry the strongest shopper proof and repeat interest.',
    href: '/bestsellers',
    icon: Sparkles,
    accent: 'from-[var(--ds-text-primary)] via-[var(--ds-text-muted)] to-[var(--ds-accent-soft)]',
  },
  {
    title: 'New Arrivals',
    copy:
      'See the freshest additions without having to build the right sort and filter combination yourself.',
    href: '/products?sort=newest',
    icon: Tags,
    accent: 'from-[var(--ds-accent-hover)] via-[var(--ds-accent-primary)] to-[var(--ds-surface-soft)]',
  },
  {
    title: 'Collections',
    copy:
      'Explore story-led collection pages that behave more like curated rooms than a flat product listing.',
    href: '/collections',
    icon: Layers3,
    accent: 'from-[var(--ds-accent-hover)] via-[var(--ds-accent-gold)] to-[var(--ds-surface-soft)]',
  },
  {
    title: 'Sale Picks',
    copy:
      'Enter the current markdown layer quickly when you are shopping by value instead of collection.',
    href: '/sale',
    icon: ArrowRight,
    accent: 'from-[var(--ds-accent-hover)] via-[var(--ds-accent-primary)] to-[var(--ds-danger-bg)]',
  },
];

export default function EditsPage() {
  return (
    <div className="min-h-screen bg-surface-paper py-token-xl md:py-token-2xl lg:py-token-3xl">
      <div className="ds-page-container mx-auto max-w-page">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-body-xs font-bold  tracking-token-wider text-muted">
            Guided Discovery
          </span>
          <Heading role="page" className="mt-4 font-display text-display-xl text-primary">
            Curated Edits
          </Heading>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-secondary">
            Use curated routes when you want a faster way into the storefront
            than broad search, generic filters, or starting from every product
            at once.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {editCards.map(({ title, copy, href, icon: Icon, accent }) => (
            <Link
              key={title}
              href={href}
              className={cn(
                cardClasses,
                'group block overflow-hidden transition-colors hover:border-border'
              )}
            >
              <div className={`bg-gradient-to-br ${accent} p-6 text-inverse`}>
                <Icon size={28} />
                <h2 className="mt-12 text-display-sm font-display">{title}</h2>
              </div>
              <div className="p-6">
                <p className="text-body-sm leading-token-relaxed text-secondary">
                  {copy}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-body-xs font-bold  tracking-token-wider text-primary">
                  Open Edit <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Link
            href="/products"
            className="border border-border px-6 py-4 text-center text-body-sm font-bold  tracking-token-wider text-primary transition-colors hover:bg-parchment"
          >
            Shop All
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.help}
            className="border border-border px-6 py-4 text-center text-body-sm font-bold  tracking-token-wider text-primary transition-colors hover:bg-parchment"
          >
            Help Center
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.contact}
            className="bg-primary px-6 py-4 text-center text-body-sm font-bold  tracking-token-wider text-inverse transition-colors hover:bg-secondary"
          >
            Contact Concierge
          </Link>
        </div>
      </div>
    </div>
  );
}
