'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OptimizedImage, UnstyledButton } from '@/design-system';

interface CategoryBanner {
  id: string;
  image_url: string;
  headline?: string | null;
  button_label?: string | null;
  button_url?: string | null;
}

interface Props {
  banners: CategoryBanner[];
}

export default function CategoryBannerCarousel({ banners }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex =
    banners.length === 0 ? 0 : activeIndex % banners.length;

  useEffect(() => {
    if (banners.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full overflow-hidden bg-surface-soft md:hidden">
      <div className="relative aspect-[4/5] w-full">
        {banners.map((banner, index) => {
          const content = (
            <>
              <OptimizedImage
                src={banner.image_url}
                alt={banner.headline || `Category banner ${index + 1}`}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-top"
              />
              {(banner.headline || banner.button_label) && (
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.60)] via-[rgba(var(--ds-black-rgb),0.10)] to-transparent">
                  <div className="absolute inset-x-0 bottom-0 flex justify-center px-[var(--ds-space-md)] pb-[var(--ds-space-lg)] pt-20 text-center">
                    <div className="max-w-[18rem] text-inverse">
                      {banner.headline ? (
                        <h2 className="category-banner-title">
                          {banner.headline}
                        </h2>
                      ) : null}
                      {banner.button_label ? (
                        <span className="category-banner-cta mt-4 inline-flex items-center rounded-full border border-surface-paper/70 bg-transparent px-5 py-2.5 text-inverse">
                          {banner.button_label}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </>
          );

          return banner.button_url ? (
            <Link
              key={banner.id}
              href={banner.button_url}
              className={`absolute inset-0 block transition-opacity duration-700 ${
                index === safeActiveIndex
                  ? 'opacity-100'
                  : 'pointer-events-none opacity-0'
              }`}
            >
              {content}
            </Link>
          ) : (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === safeActiveIndex
                  ? 'opacity-100'
                  : 'pointer-events-none opacity-0'
              }`}
            >
              {content}
            </div>
          );
        })}
      </div>

      {banners.length > 1 ? (
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-[var(--ds-space-xs)]">
          {banners.map((banner, index) => (
            <UnstyledButton
              key={banner.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-[var(--ds-radius-pill)] transition-all ${
                index === safeActiveIndex
                  ? 'w-7 bg-surface-paper'
                  : 'w-2.5 bg-surface-paper/55'
              }`}
              aria-label={`Go to category banner ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
