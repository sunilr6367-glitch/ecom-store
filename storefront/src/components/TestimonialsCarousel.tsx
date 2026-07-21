'use client';

import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, IconButton, OptimizedImage } from '@/design-system';

interface Testimonial {
  id: string;
  name: string;
  location?: string;
  avatar_url?: string | null;
  rating?: number;
  content: string;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
}

export default function TestimonialsCarousel({
  testimonials,
}: TestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : testimonials.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < testimonials.length - 1 ? prev + 1 : 0));
  };

  const currentTestimonial = testimonials[currentIndex];
  const initials = currentTestimonial.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const rating = currentTestimonial.rating ?? 5;

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      {testimonials.length > 1 && (
        <>
          <IconButton
            type="button"
            onClick={handlePrev}
            variant="ghost"
            size="md"
            className="absolute left-0 top-1/2 z-10 h-10 w-10 -translate-x-4 -translate-y-1/2 rounded-full bg-[rgba(var(--ds-surface-paper-rgb),0.1)] text-inverse hover:bg-[rgba(var(--ds-surface-paper-rgb),0.2)] md:-translate-x-16"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={20} />
          </IconButton>
          <IconButton
            type="button"
            onClick={handleNext}
            variant="ghost"
            size="md"
            className="absolute right-0 top-1/2 z-10 h-10 w-10 translate-x-4 -translate-y-1/2 rounded-full bg-[rgba(var(--ds-surface-paper-rgb),0.1)] text-inverse hover:bg-[rgba(var(--ds-surface-paper-rgb),0.2)] md:translate-x-16"
            aria-label="Next testimonial"
          >
            <ChevronRight size={20} />
          </IconButton>
        </>
      )}

      {/* Testimonial Content */}
      <div className="animate-fade-in">
        {/* Stars */}
        <div className="mb-10 flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={24}
              fill={i < rating ? 'currentColor' : 'none'}
              className={i < rating ? 'text-accent-gold' : 'text-secondary'}
            />
          ))}
        </div>

        {/* Quote */}
        <h2 className="text-display-md md:text-display-xl lg:text-display-xl font-display italic leading-token-tight mb-12 max-w-4xl mx-auto">
          &ldquo;{currentTestimonial.content}&rdquo;
        </h2>

        {/* Author */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-[rgba(var(--ds-text-secondary-rgb),0.5)] backdrop-blur-sm rounded-full mb-2 overflow-hidden relative flex items-center justify-center border border-border">
            {currentTestimonial.avatar_url ? (
              <OptimizedImage
                src={currentTestimonial.avatar_url}
                alt={currentTestimonial.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span className="text-muted font-display text-display-sm italic">
                {initials}
              </span>
            )}
          </div>
          <p className="font-bold text-body-sm tracking-token-wider ">
            {currentTestimonial.name}
          </p>
          {currentTestimonial.location && (
            <p className="text-muted text-body-sm font-display italic">
              {currentTestimonial.location}
            </p>
          )}
        </div>
      </div>

      {/* Dots Indicator */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {testimonials.map((_, index) => (
            <Button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              variant="ghost"
              size="none"
              className="flex h-11 w-11 items-center justify-center rounded-full border-0 p-0"
              aria-label={`Go to testimonial ${index + 1}`}
            >
              <span
                className={`block rounded-full transition-all ${
                  index === currentIndex
                    ? 'h-2 w-6 bg-surface-paper'
                    : 'h-2 w-2 bg-secondary hover:bg-muted'
                }`}
              />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
