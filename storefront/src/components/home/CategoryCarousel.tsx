'use client';

import Link from 'next/link';
import {
  HomepageSection,
  HomepageSectionHeader,
  OptimizedImage,
  homepageScrollRailClassName,
} from '@/design-system';
import type { HomepageCategoryCard } from '@/types/homepage';

export function CategoryCarousel({ categories }: { categories: HomepageCategoryCard[] }) {
  if (categories.length === 0) return null;

  return (
    <HomepageSection
      aria-labelledby="homepage-category-carousel-title"
      data-home-section="3-category-carousel"
    >
      <HomepageSectionHeader
        heading="Shop by category"
        headingId="homepage-category-carousel-title"
        align="center"
      />

      <div className={`${homepageScrollRailClassName} gap-[var(--ds-space-sm)] md:gap-[var(--ds-space-md)]`}>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={category.link_url.replace('/categories/', '/collections/')}
            className="group block w-[45vw] max-w-[280px] flex-shrink-0 animate-fade-in md:w-[calc(25%-1rem)] md:max-w-none"
          >
            <div className="relative w-full overflow-hidden aspect-[4/5] bg-surface-soft rounded-sm">
              <OptimizedImage
                src={category.image_url}
                alt={category.name}
                fill
                sizes="(max-width: 767px) 45vw, 25vw"
                className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[var(--ds-transition)] motion-safe:group-hover:scale-105"
              />
            </div>

            <div className="mt-[var(--ds-space-xs)] w-full text-center">
              <span className="inline-block font-ui text-[14px] font-medium uppercase tracking-[var(--ds-type-label-tracking)] text-primary">
                {category.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </HomepageSection>
  );
}
