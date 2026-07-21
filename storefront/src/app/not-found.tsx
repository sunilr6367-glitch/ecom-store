import { Home, Search, ArrowLeft } from 'lucide-react';
import { ButtonLink, EmptyState } from '@/design-system';

export default function NotFound() {
  return (
    <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-parchment px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <EmptyState
        eyebrow="404"
        title="Page Not Found"
        description="Sorry, the page you are looking for does not exist. It might have been moved or deleted."
        className="max-w-2xl"
        actions={
          <>
          <ButtonLink href="/" variant="secondary" size="lg" leadingIcon={<Home size={16} />}>
            Go Home
          </ButtonLink>
          <ButtonLink
            href="/search"
            variant="outline"
            size="lg"
            leadingIcon={<Search size={16} />}
          >
            Search
          </ButtonLink>
          <ButtonLink
            href="/"
            variant="ghost"
            size="lg"
            leadingIcon={<ArrowLeft size={16} />}
          >
            Back to homepage
          </ButtonLink>
          </>
        }
      />
    </div>
  );
}
