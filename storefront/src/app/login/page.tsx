'use client';


import { Heading } from '@/design-system';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/design-system';
import { Button, IconButton } from '@/design-system';
import { StatusBanner } from '@/design-system';
import { api } from '@/lib/api';
import {
  GoogleOAuthProvider,
  GoogleLogin,
  CredentialResponse,
} from '@react-oauth/google';

const isE2E = process.env.NEXT_PUBLIC_E2E === 'true';

// Facebook OAuth Wrapper Component — uses the official Meta JS SDK (no npm package)
function FacebookOAuthWrapper({ redirect }: { redirect: string }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const FB_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  // Lazy-load the Facebook JS SDK only when the app ID is configured
  useEffect(() => {
    if (!FB_APP_ID || document.getElementById('facebook-jssdk')) return;
    window.fbAsyncInit = function () {
      window.FB.init({ appId: FB_APP_ID, cookie: true, xfbml: false, version: 'v21.0' });
    };
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [FB_APP_ID]);

  const handleLogin = () => {
    if (!window.FB) {
      setError('Facebook SDK not loaded. Please refresh and try again.');
      return;
    }
    setLoading(true);
    setError('');
    window.FB.login(
      (authResp) => {
        if (!authResp.authResponse) {
          setError('Facebook authentication cancelled.');
          setLoading(false);
          return;
        }
        const { accessToken } = authResp.authResponse;
        window.FB.api('/me', { fields: 'name,email,picture' }, async (userInfo) => {
          try {
            const apiResponse = await api.socialLogin('facebook', {
              access_token: accessToken,
              email: userInfo.email || '',
              name: userInfo.name || '',
              avatar: userInfo.picture?.data?.url,
            });
            if (apiResponse.customer) {
              setUser(apiResponse.customer);
              router.push(redirect);
            } else {
              setError('Login failed. Please try again.');
            }
          } catch (err: unknown) {
            console.error('Facebook login error:', err);
            setError(
              err instanceof Error ? err.message : 'Facebook login failed. Please try again.'
            );
          } finally {
            setLoading(false);
          }
        });
      },
      { scope: 'email,public_profile' }
    );
  };

  if (isE2E || !FB_APP_ID) {
    return (
      <StatusBanner tone="warning">
        Facebook login unavailable here. Please use email login.
      </StatusBanner>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <StatusBanner tone="danger">
          {error}
        </StatusBanner>
      )}
      <Button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        variant="outline"
        size="lg"
        fullWidth
        leadingIcon={
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="var(--ds-social-facebook)">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        }
      >
        {loading ? 'Connecting...' : 'Continue with Facebook'}
      </Button>
    </div>
  );
}

// Google OAuth Wrapper Component
function GoogleOAuthWrapper({ redirect }: { redirect: string }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState('');
  const [buttonWidth, setButtonWidth] = useState(360);
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const container = buttonContainerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const measuredWidth = Math.round(container.getBoundingClientRect().width);
      if (!measuredWidth) return;
      setButtonWidth(Math.min(Math.max(measuredWidth, 220), 400));
    };

    updateWidth();

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    try {
      const { credential } = credentialResponse;
      if (!credential) {
        setError('Google authentication failed. Please try again.');
        return;
      }

      // Decode JWT to get user info
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      const userInfo = JSON.parse(jsonPayload);

      // Call backend API
      const response = await api.socialLogin('google', {
        id_token: credential,
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture,
      });

      if (response.customer) {
        setUser(response.customer);
        router.push(redirect);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Google login error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Google login failed. Please try again.';
      setError(errorMessage);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again or use email login.');
  };

  if (isE2E || !GOOGLE_CLIENT_ID) {
    return (
      <StatusBanner tone="warning">
        Google login unavailable here. Please use email login.
      </StatusBanner>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <StatusBanner tone="danger">
          {error}
        </StatusBanner>
      )}
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div ref={buttonContainerRef} className="mx-auto w-full max-w-sm">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="outline"
            size="large"
            width={String(buttonWidth)}
            text="continue_with"
          />
        </div>
      </GoogleOAuthProvider>
    </div>
  );
}

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResendSuccess(false);

    try {
      await login(formData);
      router.push(redirect);
    } catch (err: unknown) {
      console.error('Login error:', err);

      let errorMessage = 'Login failed. Please try again.';
      if (err && typeof err === 'object') {
        const errorObj = err as Record<string, unknown>;
        errorMessage =
          (typeof errorObj.error === 'string' && errorObj.error) ||
          (err instanceof Error && err.message) ||
          (typeof errorObj.message === 'string' && errorObj.message) ||
          'Login failed. Please try again.';
      }

      // Redirect to OTP verification
      if (errorMessage.includes('verify your email')) {
        const verifyUrl = new URL('/verify-otp', window.location.origin);
        verifyUrl.searchParams.set('email', formData.email);
        if (redirect !== '/account') {
          verifyUrl.searchParams.set('redirect', redirect);
        }
        
        // Auto-send a new OTP so they don't have to wait or click resend
        api.resendVerification(formData.email).catch(() => {});
        
        router.push(verifyUrl.pathname + verifyUrl.search);
        return;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setResending(true);
    setError('');

    try {
      const { api } = await import('@/lib/api');
      await api.resendVerification(formData.email);
      setResendSuccess(true);
      setShowResend(false);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to resend verification email';
      setError(errorMessage);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-surface-paper px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Heading role="page" className="text-display-lg font-display text-primary">Welcome Back</Heading>
          <p className="mt-2 text-muted font-light">
            Sign in to access your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <StatusBanner tone="danger">{error}</StatusBanner>
          )}

          {resendSuccess && (
            <StatusBanner tone="success">
              Verification email sent! Please check your inbox.
            </StatusBanner>
          )}

          <Input
            type="email"
            label="Email Address"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <Input
            type={showPassword ? 'text' : 'password'}
            label="Password"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            suffix={
              <IconButton
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                size="sm"
                variant="ghost"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="border-0"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </IconButton>
            }
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-body-sm text-muted hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="secondary"
            size="lg"
            fullWidth
            leadingIcon={loading ? <Loader2 className="animate-spin" size={16} /> : null}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          {showResend && (
            <div className="text-center pt-2">
              <Button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                variant="ghost"
                size="sm"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            </div>
          )}

          {/* Social Login */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle"></div>
            </div>

            {/* Only show divider and OAuth section if at least one provider is configured */}
            {!isE2E && (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) && (
              <>
                <div className="relative flex justify-center text-body-sm">
                  <span className="px-4 bg-surface-paper text-muted">
                    or continue with
                  </span>
                </div>

                <div className="space-y-3">
                  <GoogleOAuthWrapper redirect={redirect} />
                  <FacebookOAuthWrapper redirect={redirect} />
                </div>
              </>
            )}
          </div>
          </form>

        <div className="text-center text-body-sm text-muted">
          Don&apos;t have an account?{' '}
          <Link
            href={`/register?redirect=${redirect}`}
            className="text-primary font-medium underline"
          >
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-24">
          <Loader2 className="animate-spin" size={32} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
