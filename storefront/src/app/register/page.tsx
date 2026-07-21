'use client';


import { Heading } from '@/design-system';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/design-system';
import { Button, IconButton } from '@/design-system';
import { StatusBanner } from '@/design-system';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendVerification = async () => {
    setResendLoading(true);
    setError('');
    setResendSuccess(false);
    try {
      await api.resendVerification(formData.email);
      setResendSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to resend verification link');
      } else {
        setError('Failed to resend verification link');
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await register(formData);
      setSuccess(true);
      const redirect = typeof globalThis.window === 'undefined' ? null : new URLSearchParams(globalThis.window.location.search).get('redirect');
      
      const verifyUrl = new URL('/verify-otp', window.location.origin);
      verifyUrl.searchParams.set('email', formData.email);
      if (redirect) {
        verifyUrl.searchParams.set('redirect', redirect);
      }
      
      setTimeout(() => {
        router.push(verifyUrl.pathname + verifyUrl.search);
      }, 1500);
    } catch (err: unknown) {
      console.error('Registration error:', err);
      let errorMessage = 'Registration failed';
      
      if (err instanceof Error) {
        errorMessage = err.message || 'Registration failed';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-surface-paper px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Heading role="page" className="text-display-lg font-display text-primary">Join Odhvica</Heading>
          <p className="mt-2 text-muted font-light">
            Create an account to track orders and more
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {success && (
            <StatusBanner tone="success">
              Registration successful! Redirecting to verify your email...
            </StatusBanner>
          )}
          {error && (
            <StatusBanner tone="danger">
              <p>{error}</p>
              {error.includes('not verified') && (
                <Button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  variant="ghost"
                  size="sm"
                  className="mt-3 px-0 underline"
                >
                  {resendLoading ? 'Sending...' : 'Click here to resend verification link'}
                </Button>
              )}
            </StatusBanner>
          )}
          {resendSuccess && (
            <StatusBanner tone="success">
              Verification link sent! Please check your inbox.
            </StatusBanner>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="first_name"
              type="text"
              required
              label="First Name"
              value={formData.first_name}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
            />
            <Input
              id="last_name"
              type="text"
              required
              label="Last Name"
              value={formData.last_name}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value })
              }
            />
          </div>

          <Input
            id="email"
            type="email"
            required
            label="Email Address"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <Input
            id="phone"
            type="tel"
            label="Phone (Optional)"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />

          <div className="space-y-2">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={12}
              label="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              suffix={
                <IconButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="border-0"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </IconButton>
              }
            />
            <p className="text-body-xs text-muted">
              Must be at least 12 characters with , lowercase, number,
              and special character.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="secondary"
            size="lg"
            fullWidth
            leadingIcon={loading ? <Loader2 className="animate-spin" size={16} /> : null}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <div className="text-center text-body-sm text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium underline">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
