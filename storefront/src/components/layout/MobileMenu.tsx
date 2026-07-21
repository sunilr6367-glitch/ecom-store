'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Drawer } from '@/design-system';
import { STOREFRONT_NAV_ITEMS } from '@/config/storefront-navigation';
import { ChevronRight } from 'lucide-react';
import { RegionSelector } from '@/components/region/RegionSelector';

// Kept for prop compatibility
interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Collection {
  id: string;
  title?: string;
  handle: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  collections?: Collection[];
}

export default function MobileMenu({
  isOpen,
  onClose,
}: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <Drawer isOpen={isOpen} onClose={onClose} side="left" title="Menu" showHeader={true} bodyClassName="p-0">
      <nav className="flex flex-col py-[var(--ds-space-xs)]">
        <div className="border-b border-border-subtle px-5 py-4">
          <RegionSelector onRegionChange={onClose} />
        </div>

        {STOREFRONT_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`flex items-center justify-between border-b border-border-subtle px-5 py-4 transition-colors ${
                isActive ? 'text-accent bg-surface-subtle' : 'text-primary'
              }`}
            >
              <span className="font-ui text-body-md font-medium tracking-token-wide uppercase">
                {item.label}
              </span>
              <ChevronRight size={18} className="text-disabled" />
            </Link>
          );
        })}
        
        <div className="mt-[var(--ds-space-md)] px-[var(--ds-space-md)]">
          <Link
            href="/contact"
            onClick={onClose}
            className="block text-secondary font-ui text-body-sm font-medium py-2"
          >
            Contact Us
          </Link>
          <Link
            href="/track-order"
            onClick={onClose}
            className="block text-secondary font-ui text-body-sm font-medium py-2"
          >
            Track Order
          </Link>
        </div>
      </nav>
    </Drawer>
  );
}
