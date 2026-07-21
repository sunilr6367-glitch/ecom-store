import Link from 'next/link';
import {
  HomepageSection,
  HomepageSectionHeader,
  OptimizedImage,
  homepageSectionActionClassName,
} from '@/design-system';
import type { HomepageCollection } from '@/types/homepage';

export function CollectionsSection({
  collections,
}: {
  collections: HomepageCollection[];
}) {
  if (collections.length === 0) return null;

  return (
    <HomepageSection data-home-section="6-collections">
      <HomepageSectionHeader
        heading="Stories in cloth"
        action={
          <Link href="/collections" className={homepageSectionActionClassName}>
            View All Collections
          </Link>
        }
      />

      <div className="grid gap-[var(--ds-home-section-space-mobile)] md:grid-cols-2">
        {collections.slice(0, 4).map((collection) => (
          <article className="grid gap-[var(--ds-space-md)]" key={collection.id}>
            <Link
              href={`/collections/${collection.handle}`}
              className="relative block overflow-hidden bg-surface-soft aspect-[4/5]"
            >
              <OptimizedImage
                src={collection.image}
                alt={collection.title}
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                className="object-cover"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.64)] to-transparent_50%" />
              <span className="absolute inset-x-8 bottom-8 z-[1] grid gap-2 text-inverse">
                <strong className="font-display text-display-md font-[var(--ds-type-heading-weight)]">
                  {collection.title}
                </strong>
                {collection.description ? (
                  <small className="max-w-[var(--ds-caption-width)] text-body-sm">
                    {collection.description}
                  </small>
                ) : null}
              </span>
            </Link>
            <div className="grid grid-cols-3 gap-[var(--ds-space-sm)]" aria-label={`${collection.title} preview`}>
              {collection.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.handle || product.id}`}
                  data-campaign-product-id={product.id}
                  className="grid gap-2 text-body-xs text-primary no-underline"
                >
                  <span className="relative overflow-hidden bg-surface-soft aspect-[4/5]">
                    <OptimizedImage
                      src={product.thumbnail || product.images?.[0]?.url || ''}
                      alt={product.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </span>
                  <span className="line-clamp-2">{product.title}</span>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>
    </HomepageSection>
  );
}
