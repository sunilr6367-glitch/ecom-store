'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';
import { HomepageContainer, OptimizedImage } from '@/design-system';
import type { HomepageCategoryCircle } from '@/types/homepage';

export function CircularCategoriesClient({
  circles,
}: {
  circles: HomepageCategoryCircle[];
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const linksRef = useRef<Array<HTMLAnchorElement | null>>([]);

  const focusCircle = useCallback(
    (index: number, direction: 1 | -1) => {
      const nextIndex = (index + direction + circles.length) % circles.length;
      const nextLink = linksRef.current[nextIndex];
      nextLink?.focus({ preventScroll: true });
      nextLink?.scrollIntoView({
        block: 'nearest',
        inline: 'center',
      });
    },
    [circles.length]
  );

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const keyboardRow = row;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('.homepage-circle-link')
          : null;
      if (!target || !keyboardRow.contains(target)) return;

      const activeIndex = Number.parseInt(target.dataset.circleIndex || '', 10);
      if (!Number.isFinite(activeIndex)) return;

      event.preventDefault();
      focusCircle(activeIndex, event.key === 'ArrowRight' ? 1 : -1);
    }

    keyboardRow.addEventListener('keydown', handleKeyDown);
    keyboardRow.setAttribute('data-keyboard-ready', 'true');

    return () => {
      keyboardRow.removeEventListener('keydown', handleKeyDown);
      keyboardRow.removeAttribute('data-keyboard-ready');
    };
  }, [focusCircle]);

  return (
    <section
      className="overflow-hidden border-b border-border-subtle bg-surface-paper"
      aria-labelledby="homepage-circles-title"
      data-home-section="1-circle-categories"
    >
      <h2 id="homepage-circles-title" className="sr-only">
        Shop by category
      </h2>
      <HomepageContainer>
        <div
          ref={rowRef}
          className="flex gap-6 overflow-x-auto py-[var(--ds-space-md)] snap-x snap-mandatory no-scrollbar [scroll-padding-inline:var(--ds-home-gutter-mobile)] md:[scroll-padding-inline:var(--ds-home-gutter-tablet)] lg:gap-10 lg:[scroll-padding-inline:var(--ds-home-gutter-desktop)] min-[1100px]:justify-center"
        >
          {circles.map((circle, index) => (
            <Link
              key={circle.id}
              ref={(element) => {
                linksRef.current[index] = element;
              }}
              href={circle.link_url.replace('/categories/', '/collections/')}
              className="homepage-circle-link grid flex-[0_0_80px] gap-2 text-center text-body-xs text-primary no-underline snap-center focus-visible:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ds-accent-primary)] focus-visible:outline-offset-4 md:flex-[0_0_96px] lg:flex-[0_0_120px]"
              data-circle-index={index}
            >
              <span className="relative block aspect-square overflow-hidden rounded-full border border-border-subtle bg-surface-soft shadow-[0_8px_24px_rgba(var(--ds-black-rgb),0.06)]">
                <OptimizedImage
                  src={circle.image_url || ''}
                  alt=""
                  fill
                  priority
                  loading="eager"
                  sizes="(max-width: 767px) 80px, (max-width: 1023px) 96px, 120px"
                  className="object-cover"
                />
              </span>
              <span className="mx-auto max-w-[11ch] font-label text-[11px] uppercase tracking-[var(--ds-type-label-tracking)] text-secondary md:text-body-xs">
                {circle.label}
              </span>
            </Link>
          ))}
        </div>
      </HomepageContainer>
    </section>
  );
}
