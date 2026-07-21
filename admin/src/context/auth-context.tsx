'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  two_factor_enabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { user: User }) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Debug logging helper
const debugLog = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth DEBUG] ${message}`, data || '');
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    debugLog('Initializing auth state from API');
    // Check auth status by calling /auth/me endpoint
    // The cookie will be sent automatically with credentials: 'include'
    api
      .getMe()
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          debugLog('Auth state restored from API');
        }
      })
      .catch(() => {
        debugLog('Not authenticated or session expired');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = (data: { user: User }) => {
    debugLog('Login called with user data:', { hasUser: !!data.user });

    if (!data.user) {
      debugLog('ERROR: No user found in login data!', data);
      return;
    }

    setUser(data.user);
    debugLog('Auth state updated, navigating to dashboard');
    router.push('/dashboard');
  };

  const logout = async () => {
    debugLog('Logging out user');
    try {
      await api.logout();
    } catch {
      debugLog('Logout API call failed, clearing local state anyway');
    }
    setUser(null);
    debugLog('Auth state cleared, navigating to login');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
