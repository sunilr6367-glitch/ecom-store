'use client';

import type { ReactNode } from 'react';
import { trackEvent } from '@/components/Analytics';

export function buildWhatsAppHref(message: string) {
  const url = new URL('https://wa.me/message/odhvica');
  url.searchParams.set('text', message);
  url.searchParams.set('utm_source', 'whatsapp');
  url.searchParams.set('utm_medium', 'cta');
  return url.toString();
}

export function WhatsAppCTA({
  message,
  className,
  children,
  id,
}: {
  message: string;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <a
      id={id}
      href={buildWhatsAppHref(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() =>
        trackEvent('whatsapp_cta_click', {
          link_url: buildWhatsAppHref(message),
          cta_label: typeof children === 'string' ? children : 'WhatsApp CTA',
        })
      }
    >
      {children}
    </a>
  );
}
