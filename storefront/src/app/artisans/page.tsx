
import { Heading } from '@/design-system';
import type { Metadata } from 'next';
import Link from 'next/link';

import { api } from '@/lib/api';
import { buildBasicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Artisans | Odhvica',
  description: 'Meet the Jaipur and Indian textile artisans behind Odhvica handmade block print, Kantha, and quilted cotton pieces.',
  path: '/artisans',
});

export default async function ArtisansPage() {
  const { artisans = [] } = await api.getArtisans();

  return (
    <main className="ds-home-container py-token-xl md:py-token-2xl lg:py-token-3xl">
      <Heading role="page" className="collection-detail-title">Artisans</Heading>
      <p className="collection-detail-copy mt-4 max-w-3xl">
        Odhvica works with textile artisans and small craft teams connected to Jaipur block printing, quilting, embroidery, and handmade cotton accessories.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {artisans.map((artisan: { id: string; name: string; slug: string; craft_specialty?: string }) => (
          <Link key={artisan.id} href={`/artisans/${artisan.slug}`} className="border border-border-subtle p-5 transition-colors hover:border-primary">
            <p className="collection-card-product-title">{artisan.name}</p>
            <p className="collection-detail-copy mt-2">{artisan.craft_specialty || 'Textile artisan'}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
