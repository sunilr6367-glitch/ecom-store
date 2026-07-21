import { Hand, ShieldCheck, Globe2, MessageCircle } from 'lucide-react';
import { ButtonLink, HomepageSectionHeader, OptimizedImage } from '@/design-system';
import type { HomepageBrandStory } from '@/types/homepage';

const promises = [
  {
    icon: Hand,
    title: 'Ethical Sourcing',
    copy: 'We work directly with artisans in Jaipur to ensure fair wages and safe working conditions.',
  },
  {
    icon: Globe2,
    title: 'Small Batches',
    copy: 'Limited textile runs mean less waste and unique pieces you won\'t see everywhere.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Guaranteed',
    copy: 'Every piece is hand-inspected for stitching, fabric integrity, and vibrant color before shipping.',
  },
  {
    icon: MessageCircle,
    title: 'Personal Support',
    copy: 'Need sizing help? Chat with us directly on WhatsApp for real human assistance.',
  },
];

export function CraftJourneySection({ story }: { story: HomepageBrandStory | null }) {
  if (!story) return null;

  return (
    <section className="bg-[var(--ds-surface-paper)] border-y border-[var(--ds-border-subtle)] overflow-hidden" data-home-section="10-craft-journey">
      <div className="grid md:grid-cols-[1.1fr_0.9fr] lg:grid-cols-[1.2fr_0.8fr] divide-y md:divide-y-0 md:divide-x divide-[var(--ds-border-subtle)]">
        
        {/* Left: Brand Story Image & Text */}
        <div className="p-8 md:p-12 lg:p-16 bg-[var(--ds-surface-soft)] grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.88fr)]">
          <div className="relative overflow-hidden bg-[var(--ds-surface-page)] aspect-[4/5] md:aspect-[5/4] rounded-sm shadow-sm">
            <OptimizedImage
              src={story.image_url}
              alt={story.title}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          <div>
            <HomepageSectionHeader
              eyebrow="Our Story"
              heading={story.title}
              headingClassName="text-display-md font-display"
              description={story.content}
              className="mb-8 gap-3"
            />
            <ButtonLink href="/about" variant="outline" size="md">
              Discover Odhvica
            </ButtonLink>
          </div>
        </div>

        {/* Right: Craft Promises */}
        <div className="p-8 md:p-10 lg:p-16 bg-[var(--ds-surface-paper)] flex flex-col justify-center">
          <div className="mb-10">
            <div className="font-label text-label-sm tracking-widest uppercase text-muted mb-2">Why Odhvica</div>
            <h2 className="font-display text-display-md text-primary mb-3">Handmade, curated, and ready to wear.</h2>
            <p className="font-body text-body-md text-muted">
              We believe in slow-craft, direct relationships with artisans, and bringing the vibrant heritage of Indian textiles into modern, everyday wardrobes.
            </p>
          </div>

          <div className="grid gap-[var(--ds-space-md)] sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2" aria-label="Odhvica commerce promises">
            {promises.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="grid grid-cols-[auto_1fr] gap-[var(--ds-space-xs)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                   <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div>
                  <strong className="block text-primary font-label text-body-sm font-[var(--ds-type-label-weight)] tracking-[var(--ds-type-label-tracking)]">{title}</strong>
                  <p className="mt-[var(--ds-space-2xs)] text-muted font-body text-body-sm leading-[var(--ds-leading-normal)]">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
