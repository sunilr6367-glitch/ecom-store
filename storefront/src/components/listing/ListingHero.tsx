import Link from 'next/link';

import { OptimizedImage } from '@/design-system';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type ListingHeroProps = {
  eyebrow: string;
  title: string;
  description?: string | null;
  image?: string | null;
  count?: number;
  breadcrumbs: BreadcrumbItem[];
  variant?: 'category' | 'collection';
};

export default function ListingHero({
  eyebrow,
  title,
  description,
  image,
  count,
  breadcrumbs,
  variant = 'category',
}: ListingHeroProps) {
  const isCollection = variant === 'collection';
  const hasCollectionImage = isCollection && Boolean(image);

  return (
    <header className="bg-surface-paper">
      <section
        className={
          hasCollectionImage
            ? 'ds-page-container grid gap-6 pb-8 pt-6 md:grid-cols-[0.92fr_1fr] md:items-center md:gap-10 md:pb-12 md:pt-10 lg:gap-16'
            : 'relative overflow-hidden border-b border-border-subtle bg-surface-soft'
        }
      >
        {hasCollectionImage ? (
          <>
            <div className="relative aspect-[4/5] overflow-hidden bg-surface-soft md:aspect-[5/4]">
              <OptimizedImage
                src={image || ''}
                alt={title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
            <HeroCopy
              eyebrow={eyebrow}
              title={title}
              description={description}
              count={count}
              light={false}
            />
          </>
        ) : isCollection ? (
          <div className="ds-page-container py-10 md:py-14">
            <HeroCopy
              eyebrow={eyebrow}
              title={title}
              description={description}
              count={count}
              light={false}
            />
          </div>
        ) : (
          <div className="relative min-h-[240px] md:min-h-[340px]">
            {image ? (
              <OptimizedImage
                src={image}
                alt={title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            ) : null}
            {image ? (
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(var(--ds-black-rgb),0.08),rgba(var(--ds-black-rgb),0.48))]" />
            ) : null}
            <div className="ds-page-container relative z-10 flex min-h-[240px] items-end pb-8 pt-20 md:min-h-[340px] md:pb-12">
              <HeroCopy
                eyebrow={eyebrow}
                title={title}
                description={description}
                count={count}
                light={Boolean(image)}
              />
            </div>
          </div>
        )}
      </section>

      <nav
        aria-label="Breadcrumb"
        className="listing-breadcrumb ds-page-container flex items-center gap-2 border-b border-border-subtle py-4"
      >
        {breadcrumbs.map((item, index) => (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span className="text-secondary">{item.label}</span>
            )}
            {index < breadcrumbs.length - 1 ? <span aria-hidden="true">/</span> : null}
          </span>
        ))}
      </nav>
    </header>
  );
}

function HeroCopy({
  eyebrow,
  title,
  description,
  count,
  light,
}: {
  eyebrow: string;
  title: string;
  description?: string | null;
  count?: number;
  light: boolean;
}) {
  return (
    <div className={light ? 'max-w-3xl text-inverse' : 'max-w-3xl text-primary'}>
      <p className={light ? 'content-eyebrow text-inverse/80' : 'content-eyebrow'}>
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-display-lg font-normal leading-token-tight md:text-display-xl">
        {title}
      </h1>
      {description ? (
        <p
          className={
            light
              ? 'mt-4 max-w-2xl text-body-md leading-token-relaxed text-inverse/88 md:text-body-lg'
              : 'mt-4 max-w-2xl text-body-md leading-token-relaxed text-secondary md:text-body-lg'
          }
        >
          {description}
        </p>
      ) : null}
      {typeof count === 'number' ? (
        <p
          className={
            light
              ? 'mt-5 text-body-xs font-semibold tracking-token-wider text-inverse/82'
              : 'mt-5 text-body-xs font-semibold tracking-token-wider text-muted'
          }
        >
          {count} {count === 1 ? 'product' : 'products'}
        </p>
      ) : null}
    </div>
  );
}
