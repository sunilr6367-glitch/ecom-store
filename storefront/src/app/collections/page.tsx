
import { Heading } from '@/design-system';
import { EditorialMedia, MediaOverlay } from '@/design-system';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { EmptyState } from '@/design-system';
import { OptimizedImage } from '@/design-system';
import { api } from '@/lib/api';
import {
  buildBasicPageMetadata,
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  serializeJsonLd,
} from '@/lib/seo';

export const revalidate = 60;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type CollectionSummary = {
  id: string;
  title: string;
  handle: string;
  image?: string | null;
  cover_image_url?: string | null;
  description?: string | null;
  product_count?: number | string | null;
  status?: string | null;
  type?: string | null;
};

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Collections | Handcrafted Ethnic Wear for Women',
  description:
    'Explore Odhvica collections for handcrafted kurtis, shawls, wraps, sarees and premium ethnic wear for women.',
  path: '/collections',
  image: '/images/home/collection-bridal.jpg',
  keywords: [
    'ethnic wear collections',
    'handcrafted kurtis online',
    'shawls and sarees collection',
  ],
});

function CollectionCard({
  collection,
  count,
}: {
  collection: CollectionSummary;
  count: number;
}) {
  const image = collection.cover_image_url || collection.image;
  const countLabel = count > 0 ? `${count} ${count === 1 ? 'product' : 'products'}` : null;

  return (
    <Link
      href={`/collections/${collection.handle}`}
      className="group block border border-border-subtle bg-surface-paper transition-colors hover:border-primary"
    >
      {image ? (
        <div className="relative aspect-[3/4] overflow-hidden bg-surface-soft">
          <OptimizedImage
            src={image}
            alt={`${collection.title} collection - Odhvica`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      ) : null}
      <div className="p-4">
        <p className="font-label text-body-xs font-[var(--ds-type-label-weight)] tracking-[var(--ds-type-product-meta-tracking)] uppercase text-muted">
          {[collection.type || 'Curated edit', countLabel].filter(Boolean).join(' · ')}
        </p>
        <h2 className="font-display text-display-sm font-[var(--ds-type-ui-weight)] text-primary">
          {collection.title}
        </h2>
        <p className="font-body text-body-sm font-body-weight leading-relaxed text-secondary mt-1 line-clamp-2">
          {collection.description || 'View collection'}
        </p>
      </div>
    </Link>
  );
}

function getProductCount(collection: CollectionSummary) {
  const rawCount = collection.product_count;
  if (typeof rawCount === 'number') return rawCount;
  if (typeof rawCount === 'string') {
    const parsed = Number.parseInt(rawCount, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const showAll = params.show === 'all';

  const data = await api.getCollections();
  const collections: CollectionSummary[] = (data.collections || []).filter(
    (collection: CollectionSummary) =>
      collection.status === 'active' &&
      collection.handle
  );
  const featuredCollections = collections
    .filter((collection) => collection.cover_image_url || collection.image)
    .slice(0, 3);
  const featuredIds = new Set(featuredCollections.map((collection) => collection.id));
  const remainingCollections = collections.filter((collection) => !featuredIds.has(collection.id));
  const visibleCollections = showAll ? remainingCollections : remainingCollections.slice(0, 12);
  const heroImage = collections.find((collection) => collection.cover_image_url || collection.image);

  const schema = [
    buildCollectionPageJsonLd({
      name: 'Odhvica Collections',
      path: '/collections',
      description:
        'Explore handcrafted ethnic wear collections, from festive kurtis to artisanal shawls and occasion-ready silhouettes.',
      image: heroImage?.cover_image_url || heroImage?.image || '',
      items: collections.map((collection: CollectionSummary) => ({
        name: collection.title,
        path: `/collections/${collection.handle}`,
      })),
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Collections', path: '/collections' },
    ]),
  ];

  if (collections.length === 0) {
    return (
      <div className="min-h-screen bg-surface-paper">
        <div className="ds-page-container mx-auto max-w-page px-6 py-10 md:px-12 md:py-14 lg:px-20">
          <nav
            aria-label="Breadcrumb"
            className="listing-breadcrumb mb-8 flex items-center gap-2"
          >
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
            <span>/</span>
            <span className="text-secondary">Collections</span>
          </nav>
          <section className="border-y border-border-subtle py-10 md:py-14">
            <div className="text-body-xs font-semibold uppercase tracking-token-wider text-secondary">
              Curated Series
            </div>
            <Heading role="page" className="mt-4 font-display text-display-lg font-normal leading-token-tight text-primary md:text-display-xl">
              Collections
            </Heading>
          </section>
        </div>
        <div className="ds-page-container mx-auto max-w-page px-6 pb-12 md:px-12 md:pb-16 lg:px-20 lg:pb-24">
          <EmptyState
            title="No collections found."
            description="Check back soon for new curated series."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(schema),
        }}
      />

      {heroImage?.cover_image_url || heroImage?.image ? (
        <EditorialMedia variant="collection">
          <OptimizedImage
            src={heroImage.cover_image_url || heroImage.image || ''}
            alt="Collections"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        <MediaOverlay variant="soft" />
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
          <div className="max-w-3xl">
            <div className="collection-hero-eyebrow">
              Curated Series
            </div>
            <Heading role="page" className="collection-hero-title mt-4">
              Our <em className="italic">Collections</em>
            </Heading>
            <p className="collection-hero-copy mx-auto mt-4 max-w-2xl italic">
              From everyday kurta sets to handcrafted bridal lehengas — every
              edit tells a story.
            </p>
          </div>
        </div>
        </EditorialMedia>
      ) : (
        <section className="ds-page-container mx-auto max-w-page px-6 pt-10 md:px-12 md:pt-14 lg:px-20">
          <div className="border-y border-border-subtle py-10 md:py-14">
            <div className="text-body-xs font-semibold uppercase tracking-token-wider text-secondary">
              Curated Series
            </div>
            <Heading role="page" className="mt-4 font-display text-display-lg font-normal leading-token-tight text-primary md:text-display-xl">
              Our <em className="italic">Collections</em>
            </Heading>
            <p className="mt-4 max-w-2xl font-display text-display-sm leading-token-relaxed text-secondary">
              From everyday kurta sets to handcrafted bridal lehengas, every
              edit tells a story.
            </p>
          </div>
        </section>
      )}

      <div className="ds-page-container mx-auto max-w-page py-token-xl md:py-token-2xl lg:py-token-3xl">
        <nav
          aria-label="Breadcrumb"
          className="listing-breadcrumb mb-10 flex items-center gap-2"
        >
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <span className="text-secondary">Collections</span>
        </nav>

        <section className="grid gap-x-4 gap-y-8 sm:grid-cols-3 md:gap-x-6 md:gap-y-12 lg:gap-x-8 lg:gap-y-16">
          {featuredCollections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.handle}`}
              className="group relative overflow-hidden bg-surface-soft"
            >
              <div className="relative aspect-[3/4]">
                {collection.cover_image_url || collection.image ? (
                  <OptimizedImage
                    src={collection.cover_image_url || collection.image || ''}
                    alt={collection.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : null}
                <MediaOverlay variant="card" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-inverse">
                  <h2 className="collection-feature-title">
                    {collection.title}
                  </h2>
                  {collection.description ? (
                    <p className="collection-feature-copy mt-3 max-w-xs">
                      {collection.description}
                    </p>
                  ) : null}
                  <span className="collection-feature-link mt-4 inline-flex items-center gap-2">
                    Shop Now
                    <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleCollections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              count={getProductCount(collection)}
            />
          ))}
        </section>

        {remainingCollections.length > visibleCollections.length ? (
          <div className="mt-14 text-center">
            <Link
              href="/collections?show=all"
              className="inline-flex items-center gap-2 border-b border-primary pb-1 text-primary transition-colors hover:border-muted hover:text-secondary"
            >
              Load More Collections
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : showAll ? (
          <div className="mt-14 text-center">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 border-b border-primary pb-1 text-primary transition-colors hover:border-muted hover:text-secondary"
            >
              View Fewer Collections
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : null}

      </div>
    </div>
  );
}
