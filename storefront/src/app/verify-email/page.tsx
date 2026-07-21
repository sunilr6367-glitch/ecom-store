'use client';


import { Heading } from '@/design-system';
import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/design-system';
import { EmptyState } from '@/design-system';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      const timer = setTimeout(() => {
        setStatus('error');
        setMessage('No verification token provided');
      }, 0);
      return () => clearTimeout(timer);
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/store/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage('Email verified successfully! You can now login.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      } catch (err: unknown) {
        setStatus('error');
        setMessage(
          err instanceof Error ? err.message : 'Verification failed'
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-surface-paper px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <div className="max-w-md w-full space-y-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin mx-auto" size={48} />
            <Heading role="page" className="text-display-md font-display text-primary">
              Verifying your email...
            </Heading>
          </>
        )}

        {status === 'success' && (
          <EmptyState
            icon={<CheckCircle size={48} />}
            title="Email Verified!"
            description={message}
            className="border-0"
            actions={
            <Button
              onClick={() => router.push('/login')}
              variant="secondary"
              size="md"
            >
              Go to Login
            </Button>
            }
          />
        )}

        {status === 'error' && (
          <EmptyState
            icon={<XCircle size={48} />}
            title="Verification Failed"
            description={message}
            className="border-0"
            actions={
            <Button
              onClick={() => router.push('/login')}
              variant="secondary"
              size="md"
            >
              Back to Login
            </Button>
            }
          />
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-24">
          <Loader2 className="animate-spin" size={32} />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
