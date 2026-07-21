'use client';

import Link from 'next/link';
import {
  HomepageSection,
  HomepageSectionHeader,
  OptimizedImage,
  homepageSectionActionClassName,
} from '@/design-system';
import type { HomepageCategoryCard } from '@/types/homepage';

export function EditorialCategoryGrid({ categories }: { categories: HomepageCategoryCard[] }) {
  if (categories.length < 3) return null; // Needs at least 3 for this layout

  const primary = categories[0];
  const secondary = [categories[1], categories[2]];

  return (
    <HomepageSection
      aria-labelledby="homepage-editorial-categories-title"
      data-home-section="4-editorial-categories"
    >
      <HomepageSectionHeader
        heading="Shop by style"
        headingId="homepage-editorial-categories-title"
        action={
          <Link href="/collections" className={homepageSectionActionClassName}>
            View All
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--ds-space-sm)] md:gap-[var(--ds-space-md)]">
        {/* Large Card */}
        <Link
          href={primary.link_url.replace('/categories/', '/collections/')}
          className="group relative flex flex-col w-full aspect-[3/4] md:aspect-auto md:h-full overflow-hidden bg-surface-soft"
        >
          <OptimizedImage
            src={primary.image_url}
            alt={primary.name}
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
            className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-[var(--ds-transition)] motion-safe:group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.6)] to-transparent via-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-6 text-inverse z-10">
            <h3 className="font-display text-display-md leading-tight">{primary.name}</h3>
            <span className="inline-block mt-2 font-ui text-[13px] tracking-[0.1em] uppercase border-b border-inverse/50 pb-0.5">Explore {primary.name}</span>
          </div>
        </Link>

        {/* 2 Small Cards */}
        <div className="grid grid-rows-2 gap-[var(--ds-space-sm)] md:gap-[var(--ds-space-md)]">
          {secondary.map((category) => (
            <Link
              key={category.id}
              href={category.link_url.replace('/categories/', '/collections/')}
              className="group relative flex flex-col w-full aspect-[4/3] md:aspect-auto md:h-full overflow-hidden bg-surface-soft"
            >
              <OptimizedImage
                src={category.image_url}
                alt={category.name}
                fill
                sizes="(max-width: 767px) 100vw, 50vw"
                className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-[var(--ds-transition)] motion-safe:group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.6)] to-transparent via-transparent" />
              <div className="absolute bottom-0 left-0 w-full p-6 text-inverse z-10">
                <h3 className="font-display text-display-sm leading-tight">{category.name}</h3>
                <span className="inline-block mt-1 font-ui text-[12px] tracking-[0.1em] uppercase border-b border-inverse/50 pb-0.5">Shop now</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center text-muted font-ui text-body-sm italic tracking-wide">
        &ldquo;Each piece takes 2-3 weeks of hand stitching&rdquo;
      </div>
    </HomepageSection>
  );
}
