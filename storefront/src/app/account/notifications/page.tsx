'use client';


import { Heading } from '@/design-system';
import { SelectionControl } from '@/design-system';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle, Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/design-system';
import { Card } from '@/design-system';
import { StatusBanner } from '@/design-system';
import { AccountSkeleton } from '@/design-system';

const STORAGE_KEY = 'odhvica-notification-preferences';

type Preferences = {
  orderUpdates: boolean;
  newsletter: boolean;
  launches: boolean;
  backInStock: boolean;
};

const DEFAULT_PREFERENCES: Preferences = {
  orderUpdates: true,
  newsletter: true,
  launches: true,
  backInStock: true,
};

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-border-subtle py-4 last:border-b-0">
      <span>
        <span className="block text-body-sm font-semibold text-primary">{title}</span>
        <span className="mt-1 block text-body-xs leading-token-relaxed text-muted">
          {description}
        </span>
      </span>
      <SelectionControl
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

export default function AccountNotificationsPage() {
  const router = useRouter();
  const { customer, loading } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && !customer) {
      router.push('/login');
    }
  }, [customer, loading, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));

      if (preferences.newsletter && customer?.email) {
        const response = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: customer.email }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || 'Newsletter subscription could not be updated.');
        }
      }

      setStatus('success');
      setMessage('Notification preferences saved for this device.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Could not save preferences.');
    }
  }

  if (loading || !customer) return <AccountSkeleton />;

  return (
    <div className="min-h-screen bg-parchment px-4 py-10 md:px-8 md:py-16">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-3">
          <div className="inline-flex h-11 w-11 items-center justify-center border border-border-subtle bg-surface-paper">
            <Bell size={20} />
          </div>
          <p className="text-body-xs font-semibold tracking-token-wider text-muted">
            Account
          </p>
          <Heading role="page" className="font-display text-display-md text-primary">
            Notification Preferences
          </Heading>
          <p className="text-body-sm leading-token-relaxed text-secondary">
            Choose how Odhvica should keep you posted about orders, launches, and product availability.
          </p>
        </div>

        {status === 'success' ? (
          <StatusBanner tone="success" icon={<CheckCircle size={18} />}>
            {message}
          </StatusBanner>
        ) : null}
        {status === 'error' ? (
          <StatusBanner tone="danger">{message}</StatusBanner>
        ) : null}

        <Card className="p-5 md:p-6">
          <form onSubmit={handleSubmit}>
            <ToggleRow
              title="Order updates"
              description="Transactional order emails stay enabled so purchase, shipment, and return updates can reach you."
              checked={preferences.orderUpdates}
              disabled
              onChange={() => undefined}
            />
            <ToggleRow
              title="Newsletter"
              description="Subscribe your account email to craft stories, styling notes, and curated drops."
              checked={preferences.newsletter}
              onChange={(checked) => setPreferences((current) => ({ ...current, newsletter: checked }))}
            />
            <ToggleRow
              title="Launch alerts"
              description="Save a preference for limited edits and seasonal collection announcements."
              checked={preferences.launches}
              onChange={(checked) => setPreferences((current) => ({ ...current, launches: checked }))}
            />
            <ToggleRow
              title="Back-in-stock reminders"
              description="Keep restock reminders enabled when you request availability alerts on product pages."
              checked={preferences.backInStock}
              onChange={(checked) => setPreferences((current) => ({ ...current, backInStock: checked }))}
            />

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                disabled={status === 'loading'}
                leadingIcon={status === 'loading' ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
              >
                {status === 'loading' ? 'Saving' : 'Save Preferences'}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => router.push('/account')}>
                Back to Account
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
