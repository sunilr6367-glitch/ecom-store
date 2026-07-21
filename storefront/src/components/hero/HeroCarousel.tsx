'use client';

import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { IconButton, OptimizedImage } from '@/design-system';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * HeroCarousel Component
 *
 * Implements a full-screen carousel using Embla Carousel.
 * Slides come from admin-managed banners (section='hero') via API.
 */

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link?: string;
  button_text?: string;
  section?: string;
}

interface HeroCarouselProps {
  banners?: Banner[];
}

export default function HeroCarousel({ banners }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 60 }, [
    Autoplay({ delay: 6000, stopOnInteraction: false }),
  ]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const slides =
    banners?.map((b) => ({
      id: b.id,
      image: b.image_url,
      title: b.title,
      ctaText: b.button_text || '',
      ctaLink: b.link || '/products',
    })) || [];

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="relative group overflow-hidden bg-footer-bg border-b border-border">
      {/* Carousel Viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <div
              className="relative flex-[0_0_100%] min-w-0 h-[85vh] min-h-[500px] sm:min-h-[600px] flex flex-col md:flex-row"
              key={slide.id}
            >
              {/* Left Content Half (Dark Editorial) */}
              <div className="w-full md:w-1/2 h-1/2 md:h-full bg-footer-bg flex items-center justify-center p-8 md:p-16 lg:p-24 z-10">
                <div className="max-w-xl w-full animate-fade-in-up">
                  <span className="text-accent-gold text-body-xs md:text-body-sm font-bold tracking-token-wider  mb-4 md:mb-6 block">
                    Odhvica Collection
                  </span>

                  <h1 className="text-display-xl md:text-display-xl lg:text-display-xl font-display text-inverse mb-6 leading-token-tight whitespace-pre-line">
                    {slide.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4">
                    {slide.ctaText ? (
                      <Link
                        href={slide.ctaLink}
                        className="bg-surface-paper text-primary px-8 py-4 text-body-xs font-bold  tracking-token-wider hover:bg-surface-soft transition-colors shadow-xl"
                      >
                        {slide.ctaText}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Right Image Half */}
              <div className="w-full md:w-1/2 h-1/2 md:h-full relative bg-surface-soft overflow-hidden">
                <OptimizedImage
                  src={slide.image}
                  alt={slide.title.replace('\n', ' ')}
                  fill
                  className="object-cover transition-transform duration-[10000ms] ease-linear hover:scale-105"
                  priority={index === 0}
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--ds-footer-bg)]/40 via-transparent to-transparent hidden md:block" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <IconButton
        type="button"
        className="absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 rounded-full border-[rgba(var(--ds-surface-paper-rgb),0.3)] bg-[rgba(var(--ds-black-rgb),0.2)] text-inverse opacity-0 backdrop-blur-sm duration-300 hover:bg-surface-paper hover:text-primary group-hover:opacity-100 md:flex"
        onClick={scrollPrev}
        variant="ghost"
        size="lg"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </IconButton>
      <IconButton
        type="button"
        className="absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 rounded-full border-[rgba(var(--ds-surface-paper-rgb),0.3)] bg-[rgba(var(--ds-black-rgb),0.2)] text-inverse opacity-0 backdrop-blur-sm duration-300 hover:bg-surface-paper hover:text-primary group-hover:opacity-100 md:flex"
        onClick={scrollNext}
        variant="ghost"
        size="lg"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </IconButton>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block z-10">
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-[var(--ds-text-inverse)] to-transparent opacity-50"></div>
      </div>
    </div>
  );
}
