'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { ArrowRight, Lock, Mail, Shield } from 'lucide-react';
import { useNotification } from '@/context/notification-context';
import { useAuth } from '@/context/auth-context';
import type { ApiError } from '@/lib/api';

export default function LoginPage() {
  const { showNotification } = useNotification();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await api.login(
        email,
        password,
        show2FA ? twoFactorCode : undefined
      );

      login(result);
      showNotification('success', 'Welcome back!');
    } catch (err: unknown) {
      const error = err as ApiError;

      if (error.response?.require2fa) {
        setShow2FA(true);
        showNotification('info', 'Please enter your 2FA code');
      } else if (show2FA && error.message === 'Invalid 2FA Code') {
        showNotification('error', 'Invalid Authentication Code');
      } else {
        showNotification('error', error.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-lg">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-purple-500/30 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-blue-500/30 blur-3xl"></div>

        <div className="relative z-10 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Odhvica Admin</h1>
          <p className="text-gray-300">
            {show2FA ? 'Two-Factor Authentication' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="relative z-10 mt-6 space-y-4">
          {!show2FA ? (
            <>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-200"
                >
                  <Mail size={16} /> Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="admin@odhvica.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-200"
                >
                  <Lock size={16} /> Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="********"
                />
              </div>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/20 p-3 text-sm text-blue-200">
                Enter the 6-digit code from your authenticator app to continue.
              </div>
              <div>
                <label
                  htmlFor="2fa"
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-200"
                >
                  <Shield size={16} /> Authentication Code
                </label>
                <input
                  id="2fa"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) =>
                    setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))
                  }
                  required
                  maxLength={6}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-2xl tracking-widest text-white placeholder-gray-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="000 000"
                  autoFocus
                />
              </div>
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShow2FA(false);
                    setTwoFactorCode('');
                  }}
                  className="text-sm text-gray-400 underline hover:text-white"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-semibold text-white shadow-lg shadow-purple-900/50 transition-all hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Verifying...' : show2FA ? 'Verify Code' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
