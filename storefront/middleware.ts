import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:4000';

const PUBLIC_FILE = /\.(?:avif|css|gif|ico|jpg|jpeg|js|json|map|png|svg|txt|webp|xml)$/i;
const LOCALES = new Set(['en-in', 'en-us', 'en-gb', 'en-au', 'en-eu']);

function canonicalizePath(pathname: string) {
  if (pathname === '/') return pathname;

  const withoutTrailingSlash =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.replace(/\/+$/g, '')
      : pathname;

  return withoutTrailingSlash
    .split('/')
    .map((segment) => segment.replace(/-+$/g, ''))
    .join('/') || '/';
}

function shouldSkip(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/uploads') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    PUBLIC_FILE.test(pathname)
  );
}

async function lookupRedirect(pathname: string) {
  try {
    const response = await fetch(
      `${API_URL}/redirects/lookup?path=${encodeURIComponent(pathname)}`,
      {
        headers: { accept: 'application/json' },
        cache: 'no-store',
      }
    );
    if (!response.ok) return null;

    const payload = (await response.json()) as {
      redirect?: {
        from_path?: string;
        to_path?: string;
        status?: number;
        status_code?: number;
      } | null;
    };

    return payload.redirect || null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  if (firstSegment && LOCALES.has(firstSegment)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(new RegExp(`^/${firstSegment}`), '') || '/';
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-odhvica-locale', firstSegment);
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  const canonicalPath = canonicalizePath(pathname);
  if (canonicalPath !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = canonicalPath;
    url.search = search;
    return NextResponse.redirect(url, 301);
  }

  const redirect = await lookupRedirect(pathname);
  if (redirect?.to_path && redirect.to_path !== pathname) {
    const target = new URL(redirect.to_path, request.url);
    target.search = search || target.search;
    const status = redirect.status_code || redirect.status;
    return NextResponse.redirect(target, status === 302 ? 302 : 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
