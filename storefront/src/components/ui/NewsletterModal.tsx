'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConsentManager } from '@/lib/consent-manager';

export function NewsletterModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (window.localStorage.getItem('odhvica-newsletter-modal-seen')) return;

    const onScroll = () => {
      if (window.scrollY <= 650) return;
      if (!ConsentManager.getConsent()) return;

      window.localStorage.setItem('odhvica-newsletter-modal-seen', 'true');
      window.setTimeout(() => setOpen(true), 350);
      window.removeEventListener('scroll', onScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setStatus('success');
      setMessage(data.message || 'You are subscribed. Watch your inbox for the welcome offer.');
      setEmail('');
      setName('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Network error. Please try again.');
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={() => setOpen(false)}
      title="Get early access and a welcome code"
      className="max-w-[520px]"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-body-xs font-semibold  tracking-token-wider text-muted">
          Welcome gift
        </div>
        <p className="text-body-sm leading-token-relaxed text-secondary">
          Subscribe for artisan stories, launches, and the active welcome offer.
        </p>
        {status === 'success' ? (
          <div className="flex gap-3 border border-success bg-success-bg p-4 text-body-sm text-success" role="status">
            <CheckCircle className="mt-0.5 shrink-0" size={18} />
            <p>{message}</p>
          </div>
        ) : null}
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          aria-label="Your name"
          disabled={status === 'loading' || status === 'success'}
        />
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          aria-label="Email address"
          required
          disabled={status === 'loading' || status === 'success'}
        />
        {status === 'error' ? (
          <p className="text-body-sm text-error" role="alert">
            {message}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="secondary"
          size="lg"
          fullWidth
          disabled={status === 'loading' || status === 'success'}
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Subscribing
            </>
          ) : (
            'Claim Welcome Offer'
          )}
        </Button>
        <Link
          href="/products"
          onClick={() => setOpen(false)}
          className="block w-full border border-border-subtle px-6 py-4 text-center text-body-xs font-semibold  tracking-token-wider text-primary transition-colors hover:border-primary"
        >
          No Thanks
        </Link>
      </form>
    </Modal>
  );
}
