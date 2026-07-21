
import { Heading } from '@/design-system';
import Link from 'next/link';
import { OptimizedImage } from '@/design-system';
import { EmptyState } from '@/design-system';
import { api } from '@/lib/api';

export const revalidate = 60; // Re-generate at most every 60 seconds (ISR)

// Define interface for post since backend types may not have it
interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  published_at?: string;
  updated_at?: string;
}

export default async function JournalPage() {
  const data = await api.getPosts();
  const posts: Post[] = data.posts || [];

  return (
    <div className="ds-page-container mx-auto max-w-page py-token-xl md:py-token-2xl lg:py-token-3xl">
      <div className="mb-12 space-y-4 text-center md:mb-16">
        <span className="text-body-xs font-bold  tracking-token-wider text-muted">
          The Journal
        </span>
        <Heading role="page" className="text-display-xl font-display text-primary italic">
          Stories from the Atelier
        </Heading>
        <p className="text-secondary font-light max-w-2xl mx-auto">
          Exploring the intersection of heritage craftsmanship, sustainable
          luxury, and modern design.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-8 md:grid-cols-2 md:gap-x-6 md:gap-y-12 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/journal/${post.slug}`}
            className="group block space-y-4"
          >
            <div className="aspect-[4/5] bg-surface-warm overflow-hidden relative">
              {post.cover_image ? (
                <OptimizedImage
                  src={post.cover_image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-surface-soft flex items-center justify-center text-disabled italic font-display">
                  Odhvica Journal
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-body-xs text-muted font-bold  tracking-token-wider">
                {new Date(post.published_at || new Date()).toLocaleDateString()}
              </div>
              <h2 className="text-display-md font-display text-primary group-hover:text-secondary transition-colors">
                {post.title}
              </h2>
              <p className="text-secondary font-light line-clamp-3">
                {post.excerpt || post.content.substring(0, 150) + '...'}
              </p>
              <span className="inline-block text-body-xs font-bold border-b border-primary pb-1 mt-2">
                Read Story
              </span>
            </div>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <EmptyState
          title="No stories published yet."
          description="New craft, styling, and atelier stories will appear here when they are published."
          className="mt-12"
        />
      )}
    </div>
  );
}
