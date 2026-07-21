import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function WholesaleHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-[var(--ds-surface-page)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[var(--ds-content-width)]">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-heading text-xl font-bold tracking-tight text-[var(--ds-text-primary)]">
            ODHVICA <span className="font-body text-sm font-normal text-[var(--ds-text-secondary)]">WHOLESALE</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--ds-text-secondary)]">
            <Link href="/" className="hover:text-[var(--ds-text-primary)] transition-colors">Home</Link>
            <Link href="/products" className="hover:text-[var(--ds-text-primary)] transition-colors">Catalog</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Buyer Login
          </Button>
          <Button variant="primary" size="sm">
            Request Catalogue
          </Button>
        </div>
      </div>
    </header>
  );
}
