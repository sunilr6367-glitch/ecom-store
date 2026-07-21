import { ButtonLink, HomepageSection, HomepageSectionHeader, OptimizedImage } from '@/design-system';
import type { HomepageBrandStory } from '@/types/homepage';

export function BrandStory({ story }: { story: HomepageBrandStory | null }) {
  if (!story) return null;

  return (
    <HomepageSection data-home-section="8-brand-story">
      <div className="grid items-center gap-[var(--ds-space-lg)] md:grid-cols-[minmax(0,1fr)_minmax(320px,0.88fr)]">
        <div className="relative overflow-hidden bg-surface-soft aspect-[4/5] md:aspect-[5/4]">
          <OptimizedImage
            src={story.image_url}
            alt={story.title}
            fill
            sizes="(max-width: 900px) 100vw, 55vw"
            className="object-cover"
          />
        </div>
        <div className="py-[var(--ds-space-md)]">
          <HomepageSectionHeader
            eyebrow="Our Story"
            heading={story.title}
            headingClassName="text-display-md font-[var(--ds-type-heading-weight)]"
            description={story.content}
            className="mb-[var(--ds-space-lg)] gap-[var(--ds-space-xs)]"
          />
          <ButtonLink href="/about" variant="outline" size="md">
            Discover Odhvica
          </ButtonLink>
        </div>
      </div>
    </HomepageSection>
  );
}
