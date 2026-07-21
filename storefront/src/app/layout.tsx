import type { Metadata } from 'next';
import localFont from 'next/font/local';

import './globals.css';
import '../styles/storefront.css';
import { Analytics } from '@/components/Analytics';
import { MainLayout } from '@/components/layout/MainLayout';
import { RootErrorBoundary } from '@/components/RootErrorBoundary';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { CurrencyProvider } from '@/context/currency-context';
import { NotificationProvider } from '@/context/notification-context';
import { RecentlyViewedProvider } from '@/context/recently-viewed-context';
import { ShopProvider } from '@/context/shop-context';
import { WholesaleCartProvider } from '@/context/wholesale-cart-context';
import { WholesaleProvider } from '@/context/wholesale-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { LogRocketProvider } from '@/components/LogRocketProvider';
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  DEFAULT_OG_IMAGE,
  serializeJsonLd,
  SITE_NAME,
  SITE_URL,
} from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Indian Ethnic Wear | ${SITE_NAME}`,
  description:
    'Shop handcrafted kurtis, shawls, sarees, wraps and artisanal ethnic wear for women at Odhvica.',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `Indian Ethnic Wear | ${SITE_NAME}`,
    description:
      'Shop handcrafted kurtis, shawls, sarees, wraps and artisanal ethnic wear for women at Odhvica.',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        alt: `${SITE_NAME} handcrafted Indian ethnic wear`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Indian Ethnic Wear | ${SITE_NAME}`,
    description:
      'Shop handcrafted kurtis, shawls, sarees, wraps and artisanal ethnic wear for women at Odhvica.',
    images: [DEFAULT_OG_IMAGE],
  },
};

const fontCardo = localFont({
  src: [
    {
      path: '../assets/fonts/Cardo-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Cardo-Italic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../assets/fonts/Cardo-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-cardo',
});

const fontAmiri = localFont({
  src: [
    {
      path: '../assets/fonts/Amiri-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Amiri-Italic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../assets/fonts/Amiri-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Amiri-BoldItalic.ttf',
      weight: '700',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-amiri',
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isE2E = process.env.NEXT_PUBLIC_E2E === 'true';
  const csrfToken = await import('@/lib/csrf').then((module) =>
    module.CsrfManager.getServerToken()
  );
  const globalSchema = [buildOrganizationJsonLd(), buildWebsiteJsonLd()];

  return (
    <html
      lang="en"
      className={`${fontCardo.variable} ${fontAmiri.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}
        />
        <link rel="preconnect" href={SITE_URL} />
        {csrfToken && <meta name="csrf-token" content={csrfToken} />}
        {!isE2E ? (
          <>
            <link
              rel="preconnect"
              href="https://res.cloudinary.com"
              crossOrigin="anonymous"
            />
            <link rel="dns-prefetch" href="https://res.cloudinary.com" />
          </>
        ) : null}

      </head>
      <body className="font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(globalSchema) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-primary focus:px-4 focus:py-2 focus:text-body-sm focus:text-inverse"
        >
          Skip to main content
        </a>

        <RootErrorBoundary>
          <NotificationProvider>
            <ShopProvider>
              <CurrencyProvider>
                <AuthProvider>
                  <LogRocketProvider>
                    <CartProvider>
                      <WholesaleCartProvider>
                        <WishlistProvider>
                          <RecentlyViewedProvider>
                            <WholesaleProvider>
                              <MainLayout>{children}</MainLayout>
                            </WholesaleProvider>
                          </RecentlyViewedProvider>
                        </WishlistProvider>
                      </WholesaleCartProvider>
                    </CartProvider>
                  </LogRocketProvider>
                </AuthProvider>
              </CurrencyProvider>
            </ShopProvider>
          </NotificationProvider>
        </RootErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
