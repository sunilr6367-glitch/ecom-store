'use client';


import { Heading } from '@/design-system';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/design-system';
import { Button, IconButton } from '@/design-system';
import { Card } from '@/design-system';

export default function WholesaleLoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.login(formData);

      if (response.customer || response.data?.customer) {
        window.dispatchEvent(new Event('auth-change'));
        router.push('/wholesale');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(
        err instanceof Error ? err.message : 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-surface px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-8">
          <Heading role="page" className="text-display-md font-bold text-primary">Wholesale Login</Heading>
          <p className="text-secondary mt-2">
            Sign in to access your wholesale account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            label="Email Address"
            placeholder="you@company.com"
            required
          />

          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
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

          {error && (
            <div className="bg-danger-bg border border-danger text-error px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            variant="secondary"
            size="lg"
            fullWidth
            leadingIcon={loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-body-sm text-secondary">
            New to Odhvica Wholesale?{' '}
            <Link
              href="/wholesale"
              className="text-info hover:underline font-medium"
            >
              Apply Now
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/wholesale"
            className="text-body-sm text-muted hover:text-secondary"
          >
            Back to Wholesale
          </Link>
        </div>
      </Card>
    </div>
  );
}
