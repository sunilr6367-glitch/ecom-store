'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Instagram } from 'lucide-react';
import { PaymentIcons } from '@/design-system';
import NewsletterForm from '@/components/NewsletterForm';
import { storefrontTrust } from '@/config/storefront-trust';
import { api } from '@/lib/api';
import { ArtisanFooterAnimation } from '@/components/layout/ArtisanFooterAnimation';

const shopLinks = [
  { label: 'New Kantha Short Kimono', href: '/categories/new-kantha-short-kimono' },
  { label: 'Vintage Kantha Jacket', href: '/categories/vintage-kantha-jacket' },
  { label: 'Velvet Suzani Jacket', href: '/categories/velvet-suzani-jacket' },
  { label: 'Velvet Long Kimono', href: '/categories/velvet-long-kimono' },
  { label: 'Tote Bags', href: '/categories/tote-bags' },
  { label: 'Gown & Dress', href: '/categories/gown-dress' },
];

const supportLinks = [
  { label: 'Track Order', href: storefrontTrust.policyRoutes.track },
  { label: 'Shipping Policy', href: storefrontTrust.policyRoutes.shipping },
  { label: 'Returns & Refunds', href: storefrontTrust.policyRoutes.returns },
  { label: 'FAQ', href: storefrontTrust.policyRoutes.faq },
  { label: 'Contact Us', href: storefrontTrust.policyRoutes.contact },
  { label: 'Privacy Policy', href: storefrontTrust.policyRoutes.privacy },
  { label: 'Terms of Service', href: storefrontTrust.policyRoutes.terms },
];

const companyLinks: { label: string; href: string; highlight?: boolean }[] = [
  { label: 'About Us', href: '/about' },
  { label: 'Meet the Artisans', href: '/about#artisans' },
  { label: 'Blog / Journal', href: '/journal' },
];

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/odhvica.store/',
    icon: Instagram,
    color: 'kf-social-instagram',
  },
];

export function Footer() {
  const [activeShopLinks, setActiveShopLinks] = useState(shopLinks);

  useEffect(() => {
    let active = true;
    Promise.all([api.getCategories(), api.getCollections()])
      .then(([categoriesData, collectionsData]) => {
        if (!active) return;
        const cats = categoriesData.categories || [];
        const cols = collectionsData.collections || [];

        const filtered = shopLinks.filter((link) => {
          if (link.href.startsWith('/collections/')) {
            const handle = link.href.replace('/collections/', '');
            const existsInCols = cols.some(
              (c: { handle?: string; status?: string }) => c.handle === handle && c.status === 'active'
            );
            const existsInCats = cats.some(
              (c: { slug?: string; is_active?: boolean }) => c.slug === handle && c.is_active !== false
            );
            return existsInCols || existsInCats;
          }
          return true; // Keep "New Arrivals" etc.
        });
        setActiveShopLinks(filtered);
      })
      .catch((err) => {
        console.warn('[Footer] Failed to load categories/collections for filter:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {/* Absorbed Pre-footer strips removed per simplified homepage layout */}

      <footer data-home-section="15-footer" className="odhvica-footer relative border-t border-footer-border overflow-hidden">
        {/* Background Option B Animation */}
        <ArtisanFooterAnimation />

        <div
          className="footer-watermark overflow-hidden px-[var(--ds-space-md)] pt-[var(--ds-space-md)] sm:px-[var(--ds-space-md)] md:px-[var(--ds-space-lg)] md:pt-[var(--ds-space-md)] select-none relative z-10"
          aria-hidden="true"
        >
          Odhvica
        </div>

        <div className="ds-page-container mx-auto max-w-page px-[var(--ds-space-md)] pb-[var(--ds-space-md)] pt-[var(--ds-space-md)] sm:px-[var(--ds-space-md)] md:px-[var(--ds-space-lg)] md:pb-[var(--ds-space-lg)] md:pt-12 lg:px-20 lg:pt-24 relative z-10">
          <div className="grid grid-cols-2 gap-x-[var(--ds-space-md)] gap-y-[var(--ds-space-md)] sm:grid-cols-2 lg:grid-cols-5 lg:gap-[var(--ds-space-lg)]">
            {/* Brand Column */}
            <div className="space-y-5 col-span-2 sm:col-span-2 lg:col-span-1">
              <Link href="/" className="block">
                <span className="kf-logo font-body text-display-sm font-semibold tracking-token-wider">
                  ODHVICA
                </span>
              </Link>
              <p className="kf-link font-body text-body-md font-light leading-token-relaxed">
                Handcrafted luxury fashion connecting global citizens with the
                finest artisanal craftsmanship from India and beyond.
              </p>
              <div className="kf-muted font-body space-y-3 text-body-xs font-light">
                <p>{storefrontTrust.supportEmail}</p>
                <p>{storefrontTrust.supportPhone}</p>
                <p>{storefrontTrust.supportHours}</p>
                <p>{storefrontTrust.locationLabel}</p>
              </div>
              <div className="flex flex-wrap gap-[var(--ds-space-xs)] pt-[var(--ds-space-xs)]">
                {socialLinks.map(({ label, href, icon: Icon, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`kf-social transition-colors duration-200 ${color}`}
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {/* Shop Column */}
            <div className="col-span-1">
              <h4 className="kf-heading font-body mb-6 text-body-xs font-semibold tracking-token-wide uppercase">
                Shop
              </h4>
              <ul className="space-y-3">
                {activeShopLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="kf-link font-body text-body-md font-light transition-colors block"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Column */}
            <div className="col-span-1">
              <h4 className="kf-heading font-body mb-6 text-body-xs font-semibold tracking-token-wide uppercase">
                Support
              </h4>
              <ul className="space-y-3">
                {supportLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="kf-link font-body text-body-md font-light transition-colors block"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Column */}
            <div className="col-span-1">
              <h4 className="kf-heading font-body mb-6 text-body-xs font-semibold tracking-token-wide uppercase">
                Company
              </h4>
              <ul className="space-y-3">
                {companyLinks.map(({ label, href, highlight }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className={`font-body text-body-md transition-colors block ${
                        highlight
                          ? 'kf-highlight font-medium'
                          : 'kf-link font-light'
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stay Updated Column */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-1">
              <h4 className="kf-heading font-body mb-6 text-body-xs font-semibold tracking-token-wide uppercase">
                Stay Updated
              </h4>
              <p className="kf-muted font-body mb-4 text-body-md font-light leading-token-relaxed">
                Get 10% off your first order plus early access to new collections.
              </p>
              <NewsletterForm minimal />
              <div className="kf-dim font-body mt-4 text-body-xs">
                No spam. Unsubscribe anytime.
              </div>
            </div>
          </div>
        </div>

        <div className="kf-border border-t relative z-10">
          <div className="ds-page-container mx-auto max-w-page px-[var(--ds-space-md)] py-[var(--ds-space-md)] sm:px-[var(--ds-space-md)] md:px-[var(--ds-space-lg)] md:py-[var(--ds-space-lg)] lg:px-20">
            <PaymentIcons className="mb-4" />
            <div className="kf-legal font-body flex flex-col items-center justify-between gap-[var(--ds-space-sm)] text-center text-body-xs sm:flex-row sm:text-left">
              <p>Copyright {new Date().getFullYear()} Odhvica. All rights reserved.</p>
              <div className="flex gap-[var(--ds-space-md)]">
                <Link
                  href={storefrontTrust.policyRoutes.privacy}
                  className="kf-legal-link font-body transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href={storefrontTrust.policyRoutes.terms}
                  className="kf-legal-link font-body transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href={storefrontTrust.policyRoutes.cookies}
                  className="kf-legal-link font-body transition-colors"
                >
                  Cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
