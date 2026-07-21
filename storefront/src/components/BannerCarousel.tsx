'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, IconButton, OptimizedImage } from '@/design-system';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '@/types';

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter only 'hero' section banners if needed, or assume passed banners are filtered.
  const heroBanners = banners
    .filter((b) => b.section === 'hero')
    .sort((a, b) => a.position - b.position);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  if (heroBanners.length === 0) {
    // Fallback to original static content
    return (
      <section className="relative h-[90vh]">
        <div className="absolute inset-0 bg-surface-soft">
          <div className="w-full h-full bg-[url('/hero-boutique.jpg')] bg-cover bg-center brightness-[0.85] grayscale-[20%]">
            <div className="w-full h-full bg-gradient-to-br from-[var(--ds-text-muted)] to-[var(--ds-text-secondary)] opacity-50 mix-blend-multiply"></div>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div className="max-w-4xl px-6 space-y-8 text-inverse">
            <h1 className="text-display-xl md:text-display-xl font-display tracking-token-tight leading-token-tight drop-shadow-lg">
              ODHVICA
            </h1>
            <p className="text-body-xl md:text-display-md font-light tracking-token-wide max-w-2xl mx-auto drop-shadow-md">
              Bridging Heritage & Avant-Garde
            </p>
            <div className="pt-8">
              <Link
                href="/products"
                className="inline-block bg-surface-paper text-primary px-12 py-4 text-body-sm  tracking-token-wider font-semibold hover:bg-primary hover:text-inverse transition-all duration-300"
              >
                Shop The Collection
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const nextSlide = () =>
    setCurrentIndex((prev) => (prev + 1) % heroBanners.length);
  const prevSlide = () =>
    setCurrentIndex(
      (prev) => (prev - 1 + heroBanners.length) % heroBanners.length
    );

  return (
    <section className="relative h-[90vh] overflow-hidden group">
      {heroBanners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <div className="absolute inset-0 bg-surface-soft">
            <OptimizedImage
              src={banner.image_url}
              alt={banner.title}
              fill
              priority={index === 0}
              className="object-cover brightness-[0.85]"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-[rgba(var(--ds-black-rgb),0.2)] mix-blend-multiply"></div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div className="max-w-4xl px-6 space-y-8 text-inverse animate-in fade-in zoom-in duration-1000">
              <h1 className="text-display-xl md:text-display-xl font-display tracking-token-tight leading-token-tight drop-shadow-lg">
                {banner.title}
              </h1>
              {/* If we had subtitle in schema, we'd use it. For now, empty or hardcoded logic if needed */}
              {banner.link && (
                <div className="pt-8">
                  <Link
                    href={banner.link}
                    className="inline-block bg-surface-paper text-primary px-12 py-4 text-body-sm  tracking-token-wider font-semibold hover:bg-primary hover:text-inverse transition-all duration-300"
                  >
                    {banner.button_text || 'Shop Now'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {heroBanners.length > 1 && (
        <>
          <IconButton
            type="button"
            onClick={prevSlide}
            variant="ghost"
            size="lg"
            className="absolute left-4 top-1/2 z-20 min-h-11 min-w-11 -translate-y-1/2 text-[rgba(var(--ds-surface-paper-rgb),0.5)] hover:text-inverse"
            aria-label="Previous slide"
          >
            <ChevronLeft size={48} />
          </IconButton>
          <IconButton
            type="button"
            onClick={nextSlide}
            variant="ghost"
            size="lg"
            className="absolute right-4 top-1/2 z-20 min-h-11 min-w-11 -translate-y-1/2 text-[rgba(var(--ds-surface-paper-rgb),0.5)] hover:text-inverse"
            aria-label="Next slide"
          >
            <ChevronRight size={48} />
          </IconButton>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {heroBanners.map((_, idx) => (
              <Button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                variant="ghost"
                size="none"
                className="flex h-11 w-11 items-center justify-center rounded-full border-0 p-0"
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === currentIndex ? 'true' : 'false'}
              >
                <span
                  className={`block rounded-full transition-all ${
                    idx === currentIndex
                      ? 'h-2 w-8 bg-surface-paper'
                      : 'h-2 w-2 bg-[rgba(var(--ds-surface-paper-rgb),0.5)] hover:bg-surface-paper'
                  }`}
                />
              </Button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
