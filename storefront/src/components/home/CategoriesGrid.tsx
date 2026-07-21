import Link from 'next/link';
import { HomepageContainer, OptimizedImage } from '@/design-system';
import type { HomepageCategoryCard } from '@/types/homepage';

export function CategoriesGrid({ categories }: { categories: HomepageCategoryCard[] }) {
  const displayed = categories.slice(0, 4);
  if (displayed.length !== 4) return null;

  return (
    <section
      className="pt-[clamp(8px,1vw,12px)]"
      aria-label="Featured categories"
      data-home-section="3-featured-categories"
    >
      <HomepageContainer className="grid grid-cols-2 gap-[clamp(8px,1vw,12px)] md:grid-cols-4">
        {displayed.map((category) => (
          <Link key={category.id} href={category.link_url} className="relative aspect-[4/5] overflow-hidden bg-surface-soft group block">
            <OptimizedImage
              src={category.image_url}
              alt={category.name}
              fill
              sizes="(max-width: 767px) 50vw, 25vw"
              className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[var(--ds-transition)] motion-safe:group-hover:scale-[1.03] motion-safe:group-focus-visible:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.64)] to-transparent_50%" />
            <span className="absolute inset-x-[var(--ds-space-sm)] bottom-[var(--ds-space-sm)] z-[1] text-inverse font-display text-display-sm">{category.name}</span>
          </Link>
        ))}
      </HomepageContainer>
    </section>
  );
}
