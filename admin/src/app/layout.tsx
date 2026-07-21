import type { Metadata } from 'next';
import { AuthProvider } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';
import ErrorBoundary from '@/components/ErrorBoundary';
import AdminShell from '@/components/layout/AdminShell';
import { adminBrandConfig } from '@/config/brand';
import './globals.css';

// Fonts disabled due to Turbopack compatibility issue
// Using system fonts as fallback for now
// TODO: Re-enable next/font/google after Turbopack fix

export const metadata: Metadata = {
  title: adminBrandConfig.adminTitle,
  description: `${adminBrandConfig.storeName} platform administration`,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: adminBrandConfig.adminTitle,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={adminBrandConfig.storeName} />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased"
      >
        <ErrorBoundary>
          <AuthProvider>
            <NotificationProvider>
              <AdminShell>{children}</AdminShell>
            </NotificationProvider>
          </AuthProvider>
        </ErrorBoundary>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                      console.log('SW registered:', registration.scope);
                    })
                    .catch(error => {
                      console.log('SW registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
