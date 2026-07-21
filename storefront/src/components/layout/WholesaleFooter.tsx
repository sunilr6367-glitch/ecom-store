import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  ArrowRight,
} from 'lucide-react';

interface FooterSettings {
  wholesale_footer_catalog_link?: string;
  wholesale_footer_price_list_link?: string;
  wholesale_footer_terms_link?: string;
  wholesale_footer_shipping_link?: string;
  wholesale_footer_return_link?: string;
}

export function WholesaleFooter() {
  const [footerSettings, setFooterSettings] = useState<FooterSettings>({});

  useEffect(() => {
    const fetchFooterSettings = async () => {
      try {
        const data = await api.getFooterSettings();
        if (data.settings) {
          setFooterSettings(data.settings);
        }
      } catch (error) {
        console.error('Error fetching footer settings:', error);
      }
    };

    fetchFooterSettings();
  }, []);

  return (
    <footer className="bg-primary text-inverse">
      {/* Main Footer */}
      <div className="border-t border-secondary py-[var(--ds-space-xl)] md:py-[var(--ds-space-2xl)] lg:py-[var(--ds-space-3xl)]">
        <div className="ds-page-container mx-auto max-w-page">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[var(--ds-space-lg)]">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-[var(--ds-space-xs)] mb-[var(--ds-space-md)]">
                <div className="text-display-md font-bold tracking-token-tight">
                  ODHVICA
                </div>
                <div className="h-6 w-px bg-secondary"></div>
                <div className="text-body-xs  tracking-token-wider text-accent-gold font-bold">
                  Wholesale
                </div>
              </div>
              <p className="text-body-sm text-muted leading-token-relaxed">
                Your trusted partner for authentic artisanal luxury products.
                Serving retailers and distributors worldwide since 2020.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 text-body-xs text-accent-gold font-bold  tracking-token-wider">
                  <Building2 size={16} />
                  B2B Division
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-body-sm font-bold  tracking-token-wider mb-6 text-accent-gold">
                Quick Links
              </h4>
              <ul className="space-y-3 text-body-sm text-muted">
                <li>
                  <Link
                    href="/wholesale#benefits"
                    className="hover:text-inverse transition-colors flex items-center gap-[var(--ds-space-xs)]"
                  >
                    <ArrowRight size={14} />
                    Why Partner With Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wholesale#pricing"
                    className="hover:text-inverse transition-colors flex items-center gap-[var(--ds-space-xs)]"
                  >
                    <ArrowRight size={14} />
                    Pricing Tiers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wholesale#process"
                    className="hover:text-inverse transition-colors flex items-center gap-[var(--ds-space-xs)]"
                  >
                    <ArrowRight size={14} />
                    Ordering Process
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wholesale#inquiry"
                    className="hover:text-inverse transition-colors flex items-center gap-[var(--ds-space-xs)]"
                  >
                    <ArrowRight size={14} />
                    Request Quote
                  </Link>
                </li>
                <li className="pt-2 border-t border-secondary">
                  <Link
                    href="/"
                    className="hover:text-accent-gold transition-colors text-body-xs"
                  >
                    Visit Retail Store →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-body-sm font-bold  tracking-token-wider mb-6 text-accent-gold">
                Resources
              </h4>
              <ul className="space-y-3 text-body-sm text-muted">
                <li>
                  {footerSettings.wholesale_footer_catalog_link ? (
                    <a
                      href={footerSettings.wholesale_footer_catalog_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-inverse transition-colors flex items-center gap-[var(--ds-space-xs)]"
                    >
                      <Download size={14} />
                      Product Catalog (PDF)
                    </a>
                  ) : (
                    <span className="flex items-center gap-[var(--ds-space-xs)] opacity-50">
                      <Download size={14} />
                      Product Catalog (PDF)
                    </span>
                  )}
                </li>
                <li>
                  {footerSettings.wholesale_footer_price_list_link ? (
                    <a
                      href={footerSettings.wholesale_footer_price_list_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-inverse transition-colors flex items-center gap-[var(--ds-space-xs)]"
                    >
                      <Download size={14} />
                      Price List
                    </a>
                  ) : (
                    <span className="flex items-center gap-[var(--ds-space-xs)] opacity-50">
                      <Download size={14} />
                      Price List
                    </span>
                  )}
                </li>
                <li>
                  {footerSettings.wholesale_footer_terms_link ? (
                    <a
                      href={footerSettings.wholesale_footer_terms_link}
                      className="hover:text-inverse transition-colors flex items-center gap-[var(--ds-space-xs)]"
                    >
                      <FileText size={14} />
                      Terms & Conditions
                    </a>
                  ) : (
                    <span className="flex items-center gap-[var(--ds-space-xs)] opacity-50">
                      <FileText size={14} />
                      Terms & Conditions
                    </span>
                  )}
                </li>
                <li>
                  {footerSettings.wholesale_footer_shipping_link ? (
                    <a
                      href={footerSettings.wholesale_footer_shipping_link}
                      className="hover:text-inverse transition-colors flex items-center gap-[var(--ds-space-xs)]"
                    >
                      <FileText size={14} />
                      Shipping Policy
                    </a>
                  ) : (
                    <span className="flex items-center gap-[var(--ds-space-xs)] opacity-50">
                      <FileText size={14} />
                      Shipping Policy
                    </span>
                  )}
                </li>
                <li>
                  {footerSettings.wholesale_footer_return_link ? (
                    <a
                      href={footerSettings.wholesale_footer_return_link}
                      className="hover:text-inverse transition-colors flex items-center gap-[var(--ds-space-xs)]"
                    >
                      <FileText size={14} />
                      Return Policy
                    </a>
                  ) : (
                    <span className="flex items-center gap-[var(--ds-space-xs)] opacity-50">
                      <FileText size={14} />
                      Return Policy
                    </span>
                  )}
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-body-sm font-bold  tracking-token-wider mb-6 text-accent-gold">
                Contact B2B Team
              </h4>
              <ul className="space-y-4 text-body-sm text-muted">
                <li className="flex items-start gap-[var(--ds-space-xs)]">
                  <Mail
                    size={16}
                    className="text-accent-gold mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <div className="text-inverse font-medium mb-1">Email</div>
                    <a
                      href="mailto:wholesale@odhvica.com"
                      className="hover:text-inverse transition-colors"
                    >
                      wholesale@odhvica.com
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-[var(--ds-space-xs)]">
                  <Phone
                    size={16}
                    className="text-accent-gold mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <div className="text-inverse font-medium mb-1">Phone</div>
                    <a
                      href="tel:+1234567890"
                      className="hover:text-inverse transition-colors"
                    >
                      +1 (234) 567-890
                    </a>
                    <div className="text-body-xs text-muted mt-1">
                      Mon-Fri, 9AM-6PM EST
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-[var(--ds-space-xs)]">
                  <MapPin
                    size={16}
                    className="text-accent-gold mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <div className="text-inverse font-medium mb-1">Office</div>
                    <div className="text-muted">
                      123 Business District
                      <br />
                      New York, NY 10001
                      <br />
                      United States
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-primary py-6">
        <div className="ds-page-container mx-auto max-w-page">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-body-xs text-muted">
            <div className="flex items-center gap-[var(--ds-space-md)]">
              <span>
                &copy; {new Date().getFullYear()} Odhvica Wholesale. All rights
                reserved.
              </span>
              <span className="hidden md:block">|</span>
              <span className="hidden md:block">
                Registered Business Entity
              </span>
            </div>
            <div className="flex items-center gap-[var(--ds-space-md)]">
              <Link href="#" className="hover:text-disabled transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-disabled transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-disabled transition-colors">
                Trade Agreement
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-primary py-8 border-t border-primary">
        <div className="ds-page-container mx-auto max-w-page">
          <div className="flex flex-wrap items-center justify-center gap-8 text-secondary text-body-xs">
            <div className="flex items-center gap-[var(--ds-space-xs)]">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <Building2 size={14} className="text-warning" />
              </div>
              <span>Verified Business</span>
            </div>
            <div className="w-px h-6 bg-secondary"></div>
            <div className="flex items-center gap-[var(--ds-space-xs)]">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <FileText size={14} className="text-warning" />
              </div>
              <span>ISO Certified</span>
            </div>
            <div className="w-px h-6 bg-secondary"></div>
            <div className="flex items-center gap-[var(--ds-space-xs)]">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <MapPin size={14} className="text-warning" />
              </div>
              <span>Global Shipping</span>
            </div>
            <div className="w-px h-6 bg-secondary"></div>
            <div className="flex items-center gap-[var(--ds-space-xs)]">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <Phone size={14} className="text-warning" />
              </div>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


