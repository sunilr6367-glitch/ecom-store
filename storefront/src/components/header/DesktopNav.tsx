'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useCallback } from 'react';

import { STOREFRONT_NAV_ITEMS } from '@/config/storefront-navigation';

interface DesktopNavProps {
  activeMega: string | null;
  onMegaEnter: (label: string) => void;
  onMegaLeave: () => void;
  isTransparent?: boolean;
}

export function DesktopNav({ activeMega, onMegaEnter, onMegaLeave, isTransparent = false }: DesktopNavProps) {
  const pathname = usePathname();
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = useCallback((label: string, hasMega?: boolean) => {
    if (!hasMega) return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    enterTimer.current = setTimeout(() => onMegaEnter(label), 120);
  }, [onMegaEnter]);

  const handleLeave = useCallback(() => {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    leaveTimer.current = setTimeout(onMegaLeave, 180);
  }, [onMegaLeave]);

  return (
    <nav
      className="flex min-w-0 items-center justify-center gap-5 xl:gap-8"
      aria-label="Main navigation"
    >
      {STOREFRONT_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const isMegaOpen = activeMega === item.label;

        return (
          <div
            key={item.label}
            onMouseEnter={() => handleEnter(item.label, item.hasMega)}
            onMouseLeave={handleLeave}
          >
            <Link
              href={item.href}
              className={[
                'font-ui text-body-sm font-medium tracking-token-wide pb-1 transition-colors',
                isActive || isMegaOpen
                  ? 'text-accent border-b border-accent'
                  : isTransparent
                    ? 'text-inverse hover:text-inverse hover:border-b hover:border-inverse'
                    : 'text-secondary hover:text-primary hover:border-b hover:border-muted',
              ].join(' ')}
              aria-haspopup={item.hasMega ? 'true' : undefined}
              aria-expanded={item.hasMega ? isMegaOpen : undefined}
            >
              {item.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
