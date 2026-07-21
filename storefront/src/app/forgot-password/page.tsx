'use client';


import { Heading } from '@/design-system';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Input } from '@/design-system';
import { Button } from '@/design-system';
import { EmptyState } from '@/design-system';
import { StatusBanner } from '@/design-system';

function SuccessView({ email }: { readonly email: string }) {
  return (
    <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-surface-paper px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <EmptyState
        icon={<CheckCircle size={48} />}
        title="Check Your Email"
        description={
          <>
          If an account exists with <strong>{email}</strong>, you will receive a
          password reset link.
          </>
        }
        actions={
          <>
        <p className="basis-full text-body-sm text-muted">
          Check your spam folder if you don&apos;t receive the email within a
          few minutes.
        </p>
        <Link
          href="/login"
          className="inline-block text-primary font-medium underline"
        >
          Back to Login
        </Link>
          </>
        }
        className="max-w-md"
      />
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/store/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return <SuccessView email={email} />;

  return (
    <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-surface-paper px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-muted hover:text-primary mb-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Login
          </Link>
          <Heading role="page" className="text-display-lg font-display text-primary">
            Forgot Password?
          </Heading>
          <p className="mt-2 text-muted font-light">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <StatusBanner tone="danger">{error}</StatusBanner>
          )}

          <Input
            id="forgot-email"
            type="email"
            required
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <Button
            type="submit"
            disabled={loading}
            variant="secondary"
            size="lg"
            fullWidth
            leadingIcon={loading ? <Loader2 className="animate-spin" size={16} /> : null}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      </div>
    </div>
  );
}
