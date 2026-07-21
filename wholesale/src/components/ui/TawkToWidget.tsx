'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    Tawk_API?: {
      embedded?: string;
    };
    Tawk_LoadStart?: Date;
  }
}

interface TawkToProps {
  propertyId?: string;
}

const TAWK_PROPERTY_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

export function TawkToWidget({ propertyId }: TawkToProps) {
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { ConsentManager } = await import('@/lib/consent-manager');
        if (!mounted) return;

        if (!ConsentManager.hasConsentFor('marketing')) {
          console.log('[Tawk.to] skipping load - no marketing consent');
          return;
        }

        if (!propertyId) {
          console.warn('Tawk.to property ID not configured');
          return;
        }

        if (!TAWK_PROPERTY_ID_REGEX.test(propertyId)) {
          console.error('Invalid Tawk.to property ID format');
          return;
        }

        const script = document.createElement('script');
        script.src = `https://embed.tawk.to/${propertyId}`;
        script.async = true;
        script.charset = 'utf-8';
        script.setAttribute('crossorigin', '*');
        document.head.appendChild(script);
        scriptRef.current = script;

        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_API.embedded = 'chat-container';
      } catch (err) {
        console.error('[Tawk.to] failed to load', err);
      }
    })();

    return () => {
      mounted = false;
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current);
      }
      scriptRef.current = null;

      if (window.Tawk_API) {
        try {
          delete window.Tawk_API;
        } catch {}
      }
      if (window.Tawk_LoadStart) {
        try {
          delete window.Tawk_LoadStart;
        } catch {}
      }
    };
  }, [propertyId]);

  return null;
}

export function TawkToDirect({ propertyId }: TawkToProps) {
  if (!propertyId) return null;

  if (!TAWK_PROPERTY_ID_REGEX.test(propertyId)) {
    console.error('Invalid Tawk.to property ID format');
    return null;
  }

  return (
    <Script
      id="tawk-direct-script"
      src={`https://embed.tawk.to/${propertyId}`}
      strategy="afterInteractive"
      onError={() => {
        console.error('Failed to load Tawk.to script');
      }}
    />
  );
}
