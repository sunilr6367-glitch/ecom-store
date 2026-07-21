import Link from 'next/link';
import { Building2, Mail, Phone, Menu } from 'lucide-react';
import { IconButton } from '@/design-system';

export function WholesaleHeader() {
  return (
    <header className="sticky top-0 z-50 bg-primary text-inverse border-b border-secondary">
      {/* Top Bar */}
      <div className="bg-warning text-primary py-2">
        <div className="ds-page-container mx-auto flex max-w-page items-center justify-between text-body-xs font-bold">
          <div className="flex items-center gap-[var(--ds-space-md)]">
            <span className="flex items-center gap-[var(--ds-space-xs)]">
              <Building2 size={14} />
              B2B WHOLESALE PORTAL
            </span>
            <span className="hidden md:block">
              Volume Discounts up to 40% OFF
            </span>
          </div>
          <div className="flex items-center gap-[var(--ds-space-sm)]">
            <a
              href="mailto:wholesale@odhvica.com"
              className="hover:text-inverse flex items-center gap-1"
            >
              <Mail size={12} />
              <span className="hidden sm:inline">wholesale@odhvica.com</span>
            </a>
            <a
              href="tel:+1234567890"
              className="hover:text-inverse flex items-center gap-1"
            >
              <Phone size={12} />
              <span className="hidden sm:inline">+1 (234) 567-890</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="ds-page-container mx-auto flex h-16 max-w-page items-center justify-between lg:h-20">
        {/* Logo */}
        <Link href="/wholesale" className="flex items-center gap-[var(--ds-space-xs)]">
          <div className="text-display-md font-bold tracking-token-tight">ODHVICA</div>
          <div className="h-8 w-px bg-secondary"></div>
          <div className="text-body-xs  tracking-token-wider text-accent-gold font-bold">
            Wholesale
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-[var(--ds-space-md)] text-body-sm font-medium">
          <Link
            href="/wholesale#benefits"
            className="hover:text-accent-gold transition-colors"
          >
            Benefits
          </Link>
          <Link
            href="/wholesale#pricing"
            className="hover:text-accent-gold transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/wholesale#process"
            className="hover:text-accent-gold transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/wholesale#inquiry"
            className="hover:text-accent-gold transition-colors"
          >
            Get Quote
          </Link>
          <Link
            href="/"
            className="text-muted hover:text-inverse transition-colors text-body-xs"
          >
            ← Retail Store
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-[var(--ds-space-sm)]">
          <a
            href="#inquiry"
            className="hidden lg:block bg-warning text-primary px-6 py-2.5 text-body-xs font-bold  tracking-token-wider hover:bg-accent-gold transition-colors"
          >
            Request Pricing
          </a>
          <IconButton
            type="button"
            variant="ghost"
            size="md"
            className="text-inverse md:hidden"
            aria-label="Open wholesale navigation"
          >
            <Menu size={24} />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
