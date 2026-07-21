'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, LogOut, Menu, Shield, Truck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  getDashboardMode,
  getNavItemsForMode,
} from '@/components/layout/navigation';

interface TopHeaderProps {
  onMenuOpen: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Odhvica',
  '/dashboard/orders': 'Orders',
  '/dashboard/products': 'Products',
  '/dashboard/customers': 'Customers',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/categories': 'Categories',
  '/dashboard/settings': 'Settings',
  '/dashboard/marketing': 'Marketing',
  '/dashboard/collections': 'Collections',
  '/dashboard/reviews': 'Reviews',
  '/dashboard/returns': 'Returns',
  '/dashboard/wholesale': 'Wholesale Overview',
};

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  const mode = getDashboardMode(pathname);
  const navItems = getNavItemsForMode(mode);

  for (const item of navItems) {
    if (item.href !== '/dashboard' && pathname.startsWith(item.href)) {
      return item.label;
    }
  }

  return mode === 'wholesale' ? 'Wholesale' : 'Odhvica';
}

export default function TopHeader({
  onMenuOpen,
}: TopHeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const mode = getDashboardMode(pathname);

  const initial =
    user?.first_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'K';

  const title = getPageTitle(pathname);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-[var(--surface)]/80 px-6 py-4 backdrop-blur-xl shadow-[0_12px_32px_-4px_rgba(25,28,30,0.06)] md:left-[240px]">
      <button
        type="button"
        onClick={onMenuOpen}
        className="text-[var(--primary)] transition-all hover:opacity-70 active:scale-95 md:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-4">
        <h1 className="font-['Inter'] text-xl font-black uppercase tracking-[0.2em] text-[var(--primary)]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div ref={accountRef} className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((current) => !current)}
            className="flex items-center gap-2 rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-1.5 py-1 text-[var(--primary)] transition-all hover:border-[var(--primary)] active:scale-95"
            aria-label="Admin account"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-container)] text-xs font-bold text-[var(--surface-container-lowest)]">
              {initial}
            </span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--on-surface)] md:block">
              {mode === 'wholesale' ? 'Wholesale' : 'Admin'}
            </span>
            <ChevronDown size={14} className="hidden md:block" />
          </button>

          <div
            className={`absolute right-0 z-50 mt-4 w-72 origin-top-right rounded-xl bg-[var(--surface-container-lowest)] shadow-[0_12px_32px_-4px_rgba(25,28,30,0.12)] transition-all duration-200 ${
              accountOpen
                ? 'translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none -translate-y-2 scale-95 opacity-0'
            }`}
          >
            <div className="border-b border-[var(--surface-container-low)] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--on-surface)]">
                {user?.first_name || 'Admin'}
              </p>
              <p className="mt-1 text-[11px] text-[var(--on-surface-variant)]">
                {user?.email || 'admin@odhvica.com'}
              </p>
            </div>

            <div className="space-y-2 p-3">
              <Link
                href="/dashboard"
                onClick={() => setAccountOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                  mode === 'retail'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]'
                }`}
              >
                <Shield size={16} />
                <div>
                  <p className="font-semibold">Retail dashboard</p>
                  <p
                    className={`text-[11px] ${
                      mode === 'retail'
                        ? 'text-white/80'
                        : 'text-[var(--on-surface-variant)]'
                    }`}
                  >
                    Main admin workspace
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/wholesale"
                onClick={() => setAccountOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                  mode === 'wholesale'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]'
                }`}
              >
                <Truck size={16} />
                <div>
                  <p className="font-semibold">Wholesale dashboard</p>
                  <p
                    className={`text-[11px] ${
                      mode === 'wholesale'
                        ? 'text-white/80'
                        : 'text-[var(--on-surface-variant)]'
                    }`}
                  >
                    B2B inquiries, customers, orders
                  </p>
                </div>
              </Link>
            </div>

            <div className="border-t border-[var(--surface-container-low)] p-3">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[var(--on-surface)] transition-colors hover:bg-[var(--surface-container-low)]"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
