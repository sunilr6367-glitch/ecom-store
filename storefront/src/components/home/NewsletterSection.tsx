'use client';

import { useState, type FormEvent } from 'react';
import { Button, HomepageSection, HomepageSectionHeader, Input } from '@/design-system';
import type { HomepageNewsletter } from '@/types/homepage';

export function NewsletterSection({
  settings,
  isCompact = false,
}: {
  settings: HomepageNewsletter | null;
  isCompact?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!settings) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to subscribe');
      setStatus('success');
      setMessage(data.message || 'Welcome to the Odhvica Circle.');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <HomepageSection
      className="bg-accent text-inverse"
      contentClassName="max-w-[720px] text-center"
      data-home-section={isCompact ? undefined : '10-newsletter'}
    >
      <HomepageSectionHeader
        eyebrow="Newsletter"
        heading={settings.title}
        align="center"
        headingClassName="text-inverse"
        description={
          <span className="text-[rgba(var(--ds-white-rgb),0.82)]">{settings.subtitle}</span>
        }
      />
      <form
        onSubmit={submit}
        className="mt-[var(--ds-space-lg)] grid gap-[var(--ds-space-sm)] md:grid-cols-[minmax(0,1fr)_auto]"
      >
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          aria-label="Email address"
          required
          disabled={status === 'loading'}
        />
        <Button type="submit" variant="secondary" size="md" disabled={status === 'loading'}>
          {status === 'loading' ? 'Joining...' : 'Join the circle'}
        </Button>
      </form>
      {message ? (
        <p role={status === 'error' ? 'alert' : 'status'} className="mt-[var(--ds-space-sm)] text-body-sm text-inverse">
          {message}
        </p>
      ) : null}
    </HomepageSection>
  );
}
