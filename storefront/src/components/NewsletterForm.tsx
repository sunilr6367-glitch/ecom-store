'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button, Input } from '@/design-system';

interface NewsletterFormProps {
  minimal?: boolean;
}

export default function NewsletterForm({
  minimal = false,
}: Readonly<NewsletterFormProps>) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch(`/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <output
        className={`flex items-center gap-2 ${minimal ? 'text-success' : 'text-success'}`}
      >
        <CheckCircle size={minimal ? 16 : 20} aria-hidden="true" />
        <span className={minimal ? 'text-body-sm' : ''}>{message}</span>
      </output>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={`flex ${minimal ? 'flex-col gap-2' : 'gap-0'}`}
        aria-label="Newsletter subscription"
      >
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          disabled={status === 'loading'}
          containerClassName="flex-1"
          className={minimal ? 'bg-footer-surface text-inverse' : 'bg-[rgba(var(--ds-surface-paper-rgb),0.05)] text-inverse'}
          aria-label="Email address"
          aria-required="true"
        />
        <Button
          type="submit"
          disabled={status === 'loading'}
          variant="outline"
          size={minimal ? 'sm' : 'lg'}
          aria-label={
            status === 'loading'
              ? 'Subscribing to newsletter'
              : 'Subscribe to newsletter'
          }
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              {minimal ? '' : 'Subscribing...'}
            </>
          ) : (
            'Subscribe'
          )}
        </Button>
      </form>
      {status === 'error' && (
        <p className={`text-body-sm mt-2 text-error`} role="alert">
          {message}
        </p>
      )}
    </>
  );
}
