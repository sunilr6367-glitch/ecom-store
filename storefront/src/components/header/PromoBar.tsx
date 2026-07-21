'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Instagram,
  X,
} from 'lucide-react';
import { IconButton } from '@/design-system';

const MESSAGES = [
  'Handmade in Jaipur, Rajasthan',
  'Free shipping above Rs. 2,000',
  'WhatsApp for custom orders',
];
const SESSION_KEY = 'kv_promobar_dismissed';

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/odhvica.store/',
    icon: Instagram,
  },
];

interface PromoBarProps {
  isSticky: boolean;
}

export function PromoBar({ isSticky }: PromoBarProps) {
  const [dismissed, setDismissed] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setDismissed(sessionStorage.getItem(SESSION_KEY) === '1');
      } catch {
        setDismissed(false);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setMsgIdx((i) => (i + 1) % MESSAGES.length),
      3500
    );
    return () => clearInterval(t);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {}
  }, []);

  const goToPrevious = useCallback(() => {
    setMsgIdx((i) => (i - 1 + MESSAGES.length) % MESSAGES.length);
  }, []);

  const goToNext = useCallback(() => {
    setMsgIdx((i) => (i + 1) % MESSAGES.length);
  }, []);

  if (dismissed || isSticky) return null;

  return (
    <div className="kv-page-frame relative flex h-8 items-center justify-center bg-primary px-6 md:mx-auto md:grid md:h-10 md:w-full md:max-w-page md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-4 md:rounded-[999px] md:bg-accent-soft md:px-5 md:shadow-[0_10px_24px_rgba(var(--ds-accent-rgb),0.12)]">
      <div className="hidden items-center gap-[var(--ds-space-xs)] md:flex">
        {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="flex h-7 w-7 items-center justify-center rounded-full text-accent-hover transition-colors hover:bg-[rgba(var(--ds-surface-paper-rgb),0.35)] hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)]"
          >
            <Icon size={15} strokeWidth={1.7} />
          </a>
        ))}
      </div>

      {MESSAGES.length > 1 && (
        <div className="hidden items-center justify-end gap-1 md:flex">
          <IconButton
            type="button"
            onClick={goToPrevious}
            aria-label="Previous announcement"
            variant="ghost"
            size="sm"
            className="h-7 w-7 rounded-full text-accent-hover hover:bg-[rgba(var(--ds-surface-paper-rgb),0.35)] hover:text-primary"
          >
            <ChevronLeft size={16} strokeWidth={1.8} />
          </IconButton>
          <IconButton
            type="button"
            onClick={goToNext}
            aria-label="Next announcement"
            variant="ghost"
            size="sm"
            className="h-7 w-7 rounded-full text-accent-hover hover:bg-[rgba(var(--ds-surface-paper-rgb),0.35)] hover:text-primary"
          >
            <ChevronRight size={16} strokeWidth={1.8} />
          </IconButton>
        </div>
      )}

      <p className="text-body-xs font-medium tracking-token-wide text-disabled select-none md:truncate md:px-4 md:text-center md:text-accent-hover">
        <span className="transition-opacity duration-300">{MESSAGES[msgIdx]}</span>
      </p>
      <IconButton
        type="button"
        onClick={dismiss}
        variant="ghost"
        size="sm"
        className="absolute right-3 top-1/2 h-7 w-7 -translate-y-1/2 text-muted hover:text-disabled md:hidden"
        aria-label="Dismiss"
      >
        <X size={13} strokeWidth={2} />
      </IconButton>
    </div>
  );
}
