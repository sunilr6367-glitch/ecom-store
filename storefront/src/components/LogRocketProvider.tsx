'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { ConsentManager } from '@/lib/consent-manager';

const LOGROCKET_APP_ID = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID;
const isE2EEnvironment = process.env.NEXT_PUBLIC_E2E === 'true';

type LogRocketModule = {
  init: (appId: string, options: Record<string, unknown>) => void;
  identify: (id: string, traits?: Record<string, string | number | boolean>) => void;
};

export function LogRocketProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useAuth();
  const initialized = useRef(false);
  const consentGranted = useRef(false);
  const logRocketRef = useRef<LogRocketModule | null>(null);

  useEffect(() => {
    const consent = localStorage.getItem('logrocket_consent');
    consentGranted.current = consent === 'true';
  }, []);

  const hasSessionConsent = () =>
    typeof window !== 'undefined' &&
    ConsentManager.hasConsentFor('session_recording');

  useEffect(() => {
    if (isE2EEnvironment) return;
    if (
      !LOGROCKET_APP_ID ||
      initialized.current ||
      !consentGranted.current ||
      !hasSessionConsent()
    ) {
      return;
    }
    if (
      process.env.NODE_ENV === 'development' &&
      !process.env.NEXT_PUBLIC_ENABLE_LOGROCKET_DEV
    ) {
      return;
    }

    let cancelled = false;

    async function initializeLogRocket() {
      try {
        const logRocketModule = await import('logrocket');
        if (cancelled) return;
        const LogRocket = logRocketModule.default as LogRocketModule;
        logRocketRef.current = LogRocket;

        LogRocket.init(LOGROCKET_APP_ID!, {
          dom: {
            inputSanitizer: true,
            privateAttributeBlocklist: [
              'password',
              'credit-card',
              'cvv',
              'ssn',
              'email',
              'name',
              'address',
            ],
          },
          network: {
            requestSanitizer: (request: {
              headers?: Record<string, string>;
              body?: string;
            }) => {
              if (request.headers) {
                delete request.headers.authorization;
                delete request.headers.Authorization;
              }

              if (request.body) {
                try {
                  const body = JSON.parse(request.body) as Record<string, unknown>;
                  const piiKeys = [
                    'email',
                    'name',
                    'address',
                    'card_number',
                    'cvv',
                    'ssn',
                    'password',
                    'creditCard',
                  ];
                  for (const key of piiKeys) {
                    if (body[key]) body[key] = '[REDACTED]';
                  }
                  for (const key of Object.keys(body)) {
                    if (/(email|name|address|card|cc|cvv|ssn)/i.test(key)) {
                      body[key] = '[REDACTED]';
                    }
                  }
                  request.body = JSON.stringify(body);
                } catch {
                  // Leave non-JSON payloads unchanged.
                }
              }
              return request;
            },
            responseSanitizer: (response: { body?: string }) => {
              if (response.body) {
                try {
                  const body = JSON.parse(response.body) as Record<string, unknown>;
                  if (body.token) body.token = '[REDACTED]';
                  if (body.accessToken) body.accessToken = '[REDACTED]';
                  if (body.refreshToken) body.refreshToken = '[REDACTED]';
                  for (const key of [
                    'email',
                    'name',
                    'address',
                    'card_number',
                    'cvv',
                    'ssn',
                  ]) {
                    if (body[key]) body[key] = '[REDACTED]';
                  }
                  response.body = JSON.stringify(body);
                } catch {
                  // Leave non-JSON payloads unchanged.
                }
              }
              return response;
            },
          },
          console: {
            isEnabled: {
              log: true,
              info: true,
              warn: true,
              error: true,
              debug: process.env.NODE_ENV === 'development',
            },
          },
          release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        });

        initialized.current = true;
      } catch (error) {
        console.error('[LogRocket] Failed to initialize:', error);
      }
    }

    void initializeLogRocket();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isE2EEnvironment) return;
    if (!LOGROCKET_APP_ID || !initialized.current || !logRocketRef.current) return;

    if (customer) {
      const traits: Record<string, string | number | boolean> = {
        name:
          `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
          customer.email,
        email: customer.email,
      };

      if (customer.created_at) {
        traits.registrationDate = customer.created_at;
      }

      logRocketRef.current.identify(customer.id, traits);
      return;
    }

    logRocketRef.current.identify('anonymous');
  }, [customer]);

  return <>{children}</>;
}

export const requestLogRocketConsent = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('logrocket_consent', 'true');
    window.location.reload();
  }
};
