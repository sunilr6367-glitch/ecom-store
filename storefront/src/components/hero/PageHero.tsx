import { OptimizedImage } from '@/design-system';

/**
 * PageHero Component
 *
 * A reusable hero banner for internal pages (Shop, Collections, etc.).
 * Displays a large poster-style hero image with a text overlay.
 * Matches the visual language of the Home Page HeroCarousel.
 */

interface PageHeroProps {
  /** The main title displayed on the hero */
  title: string;
  /** A small label above the title (e.g. "The Collection", "Curated Series") */
  subtitle?: string;
  /** A brief description below the title */
  description?: string;
  /** Background image URL. Falls back to a gradient if not provided */
  image?: string;
}

export default function PageHero({
  title,
  subtitle,
  description,
  image,
}: PageHeroProps) {
  return (
    <section className="relative h-[40vh] min-h-[280px] md:h-[50vh] md:min-h-[360px] overflow-hidden flex items-center justify-center">
      {/* Background */}
      {image ? (
        <OptimizedImage src={image} alt={title} fill className="object-cover" priority />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--ds-text-secondary)] via-[var(--ds-text-secondary)] to-[var(--ds-text-primary)]" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-primary/40" />

      {/* Content */}
      <div className="ds-page-container relative z-10 mx-auto max-w-page space-y-4 px-6 text-center md:px-12 lg:px-20">
        {subtitle && (
          <span className="font-body block text-body-sm font-medium  tracking-token-wide text-inverse/80">
            {subtitle}
          </span>
        )}
        <h1 className="font-display text-display-xl font-normal tracking-token-tight text-inverse leading-token-tight">
          {title}
        </h1>
        {description && (
          <p className="font-body mx-auto max-w-xl text-body-md font-light leading-token-relaxed text-inverse/80 md:text-body-xl">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
