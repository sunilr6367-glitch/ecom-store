// CSRF Token Management
// Note: In production, ensure your backend validates the Origin/Referer header
// for cross-site request forgery protection.

import { getApiBaseUrl } from './api-base-url';

const API_URL = getApiBaseUrl();

let csrfToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (
    typeof window === 'undefined' &&
    process.env.NEXT_PHASE === 'phase-production-build'
  ) {
    return '';
  }

  try {
    const res = await fetch(`${API_URL}/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.csrf_token;
      return csrfToken || '';
    }
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CSRF] Failed to fetch CSRF token, continuing without it');
    }
  }

  return '';
}

export function clearCsrfToken() {
  csrfToken = null;
}

/**
 * CsrfManager - helper class for working with CSRF tokens across the app.
 *
 * Usage examples:
 *   // server component
 *   const token = await CsrfManager.getServerToken();
 *
 *   // client component
 *   const token = CsrfManager.getTokenFromDOM();
 *   CsrfManager.addToHeaders(headers);
 */
export class CsrfManager {
  /**
   * Generates or returns the current token; safe to call on server or client.
   */
  static async generateToken(): Promise<string> {
    return await getCsrfToken();
  }

  /**
   * Reads token from meta tag (client-side only).
   */
  static getTokenFromDOM(): string | null {
    if (typeof document === 'undefined') return null;
    const meta = document.querySelector('meta[name="csrf-token"]');
    return (meta?.getAttribute('content') as string) || null;
  }

  /**
   * Adds CSRF header to provided Headers object.
   */
  static addToHeaders(headers: Headers): void {
    const token = CsrfManager.getTokenFromDOM();
    if (token) {
      headers.set('X-CSRF-Token', token);
    }
  }

  /**
   * Appends token to FormData (for non-fetch POST forms).
   */
  static addToFormData(fd: FormData): void {
    const token = CsrfManager.getTokenFromDOM();
    if (token) {
      fd.append('csrf_token', token);
    }
  }

  /**
   * Convenience wrapper for server components to get token directly.
   */
  static async getServerToken(): Promise<string> {
    return await getCsrfToken();
  }
}
