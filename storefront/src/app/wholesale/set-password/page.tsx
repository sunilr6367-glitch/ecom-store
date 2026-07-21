'use client';


import { Heading } from '@/design-system';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/design-system';
import { Button, IconButton } from '@/design-system';
import { Card } from '@/design-system';

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordRequirements = [
    { label: 'At least 12 characters', valid: password.length >= 12 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
    {
      label: 'One special character',
      valid: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
    {
      label: 'Passwords match',
      valid: password === confirmPassword && password.length > 0,
    },
  ];

  const allRequirementsMet =
    passwordRequirements.slice(0, 5).every((r) => r.valid) &&
    password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Invalid or missing token');
      return;
    }

    if (!allRequirementsMet) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/store/auth/setup-password', {
        token,
        password,
      }) as { success?: boolean; token?: string };

      if (response.success || response.token) {
        window.dispatchEvent(new Event('auth-change'));
        setSuccess(true);
        setTimeout(() => {
          router.push('/wholesale');
        }, 2000);
      } else {
        setError('Failed to set password. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Setup password error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to set password. The link may have expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-surface px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <div className="text-center">
            <Heading role="page" className="text-display-md font-bold text-primary mb-4">
              Invalid Link
            </Heading>
            <p className="text-secondary mb-6">
              This password setup link is invalid or has expired.
            </p>
            <Link href="/wholesale" className="text-info hover:underline">
              Return to Wholesale
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-surface px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-success-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <Heading role="page" className="text-display-md font-bold text-primary mb-2">
              Password Set!
            </Heading>
            <p className="text-secondary mb-6">
              Your wholesale account has been created successfully. Redirecting
              to wholesale...
            </p>
            <Link href="/wholesale" className="text-info hover:underline">
              Go to Wholesale Now
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-surface px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-8">
          <Heading role="page" className="text-display-md font-bold text-primary">
            Set Up Your Password
          </Heading>
          <p className="text-secondary mt-2">
            Create a password to access your wholesale account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Password"
            placeholder="Enter your password"
            required
            suffix={
              <IconButton
                type="button"
                size="sm"
                variant="ghost"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="h-8 w-8 border-0"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </IconButton>
            }
          />

          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            label="Confirm Password"
            placeholder="Confirm your password"
            required
          />

          <div className="bg-surface rounded-lg p-4">
            <p className="text-body-sm font-medium text-secondary mb-2">
              Password Requirements:
            </p>
            <ul className="space-y-1">
              {passwordRequirements.map((req, index) => (
                <li key={index} className="flex items-center text-body-sm">
                  {req.valid ? (
                    <Check className="w-4 h-4 text-success mr-2" />
                  ) : (
                    <X className="w-4 h-4 text-disabled mr-2" />
                  )}
                  <span
                    className={req.valid ? 'text-success' : 'text-muted'}
                  >
                    {req.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="bg-danger-bg border border-danger text-error px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !allRequirementsMet}
            variant="secondary"
            size="lg"
            fullWidth
            leadingIcon={loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          >
            {loading ? 'Setting up...' : 'Set Password'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/wholesale"
            className="text-body-sm text-secondary hover:text-primary"
          >
            Back to Wholesale
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-info" />
        </div>
      }
    >
      <SetPasswordContent />
    </Suspense>
  );
}
