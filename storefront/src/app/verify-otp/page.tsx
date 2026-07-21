'use client';


import { Heading } from '@/design-system';
import { CodeInput } from '@/design-system';
import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/design-system';
import { StatusBanner } from '@/design-system';

export default function VerifyOtpPage() {
  const { setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const redirect = searchParams.get('redirect') || '/account';

  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    if (!email) {
      router.push('/login');
    }
  }, [email, router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtp = [...otp];
    // Use only the last character if multiple are pasted (paste handled separately)
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 4);
    
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        if (i < 4) newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      
      // Focus the next empty input or the last one
      const nextEmptyIndex = newOtp.findIndex(val => val === '');
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[3]?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }

    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.verifyOtp({ email, otp: otpValue });
      if (res.customer) {
        setUser(res.customer);
        try { window.localStorage.setItem('kv_customer_session', '1'); } catch {}
        router.push(redirect);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      setError(errorMessage);
      // Clear OTP on error for easy re-entry
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendTimer > 0) return;
    
    setResendLoading(true);
    setError('');
    setResendSuccess(false);

    try {
      await api.resendVerification(email);
      setResendSuccess(true);
      setResendTimer(60); // Start 60s cooldown
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code';
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="kv-page-gutter flex min-h-screen flex-col items-center justify-center bg-surface-paper px-6 py-12 md:px-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Heading role="page" className="text-display-lg font-display text-primary">Verify Your Email</Heading>
          <p className="mt-2 text-muted font-light">
            We sent a 4-digit code to <span className="font-medium text-primary">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <StatusBanner tone="danger">{error}</StatusBanner>}
          {resendSuccess && <StatusBanner tone="success">Verification code resent successfully!</StatusBanner>}

          <div className="flex justify-center gap-3 md:gap-4 my-8">
            {otp.map((digit, index) => (
              <CodeInput
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={loading || otp.join('').length !== 4}
            variant="secondary"
            size="lg"
            fullWidth
            leadingIcon={loading ? <Loader2 className="animate-spin" size={16} /> : null}
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </Button>
        </form>

        <div className="text-center pt-4 border-t border-border-subtle">
          <p className="text-body-sm text-muted mb-3">
            Didn&apos;t receive the code?
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={resendTimer > 0 || resendLoading}
            fullWidth
          >
            {resendLoading ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : null}
            {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Code'}
          </Button>
        </div>
      </div>
    </div>
  );
}
