import { Instagram } from 'lucide-react';
import { HomepageSection, HomepageSectionHeader, OptimizedImage } from '@/design-system';
import type { HomepageSocialPost } from '@/types/homepage';

export function InstagramSection({ posts, isCompact }: { posts: HomepageSocialPost[], isCompact?: boolean }) {
  if (posts.length === 0) return null;

  const displayCount = isCompact ? 4 : 8;

  return (
    <HomepageSection
      data-home-section={isCompact ? undefined : '9-social'}
      className={isCompact ? 'py-[var(--ds-space-xl)]' : undefined}
    >
      <HomepageSectionHeader
        eyebrow="Follow Our Journey"
        heading="From our circle"
        align="center"
        headingClassName={isCompact ? 'text-display-sm' : 'text-display-md'}
      />

      <div className={`grid grid-cols-2 gap-[var(--ds-space-2xs)] ${isCompact ? 'md:grid-cols-2 lg:grid-cols-2' : 'md:grid-cols-4'}`}>
        {posts.slice(0, displayCount).map((post) => (
          <a
            key={post.id}
            href={post.destination_url}
            target={post.destination_url.startsWith('https://') ? '_blank' : undefined}
            rel={post.destination_url.startsWith('https://') ? 'noopener noreferrer' : undefined}
            className="group relative block overflow-hidden bg-surface-soft aspect-square rounded-sm"
          >
            <OptimizedImage
              src={post.image_url}
              alt={post.alt_text}
              fill
              sizes="(max-width: 767px) 50vw, 25vw"
              className="object-cover"
            />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--ds-space-sm)] bg-[rgba(var(--ds-ink-rgb),0.6)] p-[var(--ds-space-md)] text-center text-inverse opacity-0 transition-opacity duration-[180ms] ease-[ease] group-hover:opacity-100 group-focus-visible:opacity-100">
              <Instagram aria-hidden="true" />
              {post.caption ? (
                <span className="line-clamp-3 overflow-hidden text-body-xs">{post.caption}</span>
              ) : null}
            </span>
          </a>
        ))}
      </div>
    </HomepageSection>
  );
}
