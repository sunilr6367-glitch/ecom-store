import { OptimizedImage } from '@/design-system';
import type { HomepageTestimonial } from '@/types/homepage';

interface TestimonialsProps {
  testimonials: HomepageTestimonial[];
}

function renderStars(rating?: number) {
  const filled = Math.max(0, Math.min(5, Math.round(rating || 5)));
  return Array.from({ length: 5 }, (_, index) => (
    <span key={index} className={index < filled ? 'text-accent-gold' : 'text-muted'}>
      ★
    </span>
  ));
}

export function Testimonials({ testimonials }: TestimonialsProps) {
  const displayed = testimonials.slice(0, 3);

  if (displayed.length === 0) return null;

  return (
    <section className="max-md:py-[var(--ds-space-md)] bg-surface-paper border-b border-border-subtle" data-home-section="9-testimonials">
      <div className="ds-home-container">
        <div className="mb-[var(--ds-space-md)] flex flex-col gap-[var(--ds-space-sm)] md:mb-[var(--ds-space-lg)]">
          <div className="kv-tag">Love shared by customers</div>
        </div>

        <div className="grid gap-[var(--ds-space-md)] md:grid-cols-3 lg:gap-8">
          {displayed.map((testimonial) => (
            <article key={testimonial.id} className="rounded-[var(--ds-radius-lg)] bg-surface-soft p-8 text-center sm:p-10 border border-border-subtle/30">
              <div className="flex items-center justify-center gap-1 text-body-sm">
                {renderStars(testimonial.rating)}
              </div>

              <p className="font-body mt-6 min-h-[108px] text-body-lg italic leading-relaxed text-primary">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="mt-[var(--ds-space-md)] flex items-center justify-center gap-[var(--ds-space-xs)]">
                {testimonial.avatar_url ? (
                  <div className="relative h-11 w-11 overflow-hidden rounded-full bg-surface-soft">
                    <OptimizedImage
                      src={testimonial.avatar_url}
                      alt={testimonial.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="text-left">
                  <p className="font-body text-body-sm font-semibold tracking-token-wide text-primary">
                    {testimonial.name}
                  </p>
                  {testimonial.location ? (
                    <p className="font-body text-body-xs tracking-token-wider text-muted">
                      {testimonial.location}
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
