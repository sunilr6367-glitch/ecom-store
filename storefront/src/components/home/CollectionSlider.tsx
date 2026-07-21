'use client';

import Link from 'next/link';
import {
  HomepageSection,
  HomepageSectionHeader,
  OptimizedImage,
  homepageSectionActionClassName,
} from '@/design-system';
import type { HomepageCollection } from '@/types/homepage';
import { cn } from '@/lib/utils';

export function CollectionSlider({ collections }: { collections: HomepageCollection[] }) {
  if (!collections || collections.length === 0) return null;

  const featured = collections[0];
  const secondary = collections.slice(1, 3);
  const remaining = collections.slice(3);

  return (
    <HomepageSection
      aria-labelledby="homepage-collection-slider-title"
      data-home-section="13-collection-slider"
    >
      <HomepageSectionHeader
        heading="Curated Collections"
        headingId="homepage-collection-slider-title"
        align="center"
        headingClassName="font-light italic tracking-wide"
        action={
          <Link href="/collections" className={homepageSectionActionClassName}>
            View All
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <Link
          href={`/collections/${featured.handle}`}
          className="group flex flex-col lg:col-span-7 lg:min-h-[700px]"
        >
          <div className="relative w-full flex-grow overflow-hidden aspect-[4/5] lg:aspect-auto rounded-sm bg-surface-soft">
            <OptimizedImage
              src={featured.image}
              alt={featured.title}
              fill
              sizes="(max-width: 1023px) 100vw, 60vw"
              className="object-cover motion-safe:transition-transform duration-[1500ms] ease-out motion-safe:group-hover:scale-[1.03]"
            />
          </div>

          <div className="mt-[var(--ds-space-md)] flex flex-col text-center text-primary lg:text-left">
            <h3 className="mb-2 font-display text-display-md font-light tracking-wide">
              {featured.title}
            </h3>
            {featured.description ? (
              <p className="mx-auto max-w-md text-body-md font-light text-primary/80 lg:mx-0">
                {featured.description}
              </p>
            ) : null}
          </div>
        </Link>

        {secondary.length > 0 ? (
          <div
            className={cn(
              'grid gap-4 lg:col-span-5 lg:gap-6',
              secondary.length === 2 ? 'grid-rows-2' : 'grid-rows-1'
            )}
          >
            {secondary.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.handle}`}
                className="group flex flex-col"
              >
                <div className="relative w-full flex-grow overflow-hidden aspect-square lg:h-full lg:aspect-auto rounded-sm bg-surface-soft">
                  <OptimizedImage
                    src={collection.image}
                    alt={collection.title}
                    fill
                    sizes="(max-width: 1023px) 100vw, 40vw"
                    className="object-cover motion-safe:transition-transform duration-[1500ms] ease-out motion-safe:group-hover:scale-[1.03]"
                  />
                </div>

                <div className="mt-[var(--ds-space-sm)] text-center text-primary lg:text-left">
                  <h3 className="font-display text-display-sm font-light tracking-wide">
                    {collection.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {remaining.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-6 lg:grid-cols-3 lg:gap-6">
          {remaining.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.handle}`}
              className="group flex flex-col"
            >
              <div className="relative w-full flex-grow overflow-hidden aspect-[4/5] rounded-sm bg-surface-soft">
                <OptimizedImage
                  src={collection.image}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 1023px) 100vw, 33vw"
                  className="object-cover motion-safe:transition-transform duration-[1500ms] ease-out motion-safe:group-hover:scale-[1.03]"
                />
              </div>

              <div className="mt-[var(--ds-space-sm)] text-center text-primary lg:text-left">
                <h3 className="font-display text-display-sm font-light tracking-wide">
                  {collection.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </HomepageSection>
  );
}
