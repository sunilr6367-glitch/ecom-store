import type { Metadata } from 'next';
import './globals.css';
import { TrustStrip } from '@/components/layout/TrustStrip';
import { WholesaleHeader } from '@/components/layout/WholesaleHeader';
import { WholesaleFooter } from '@/components/layout/WholesaleFooter';

export const metadata: Metadata = {
  title: 'Odhvica Wholesale',
  description: 'Wholesale B2B Channel for Odhvica',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cardo:ital,wght@0,400;0,700;1,400&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-[var(--ds-surface-page)] text-[var(--ds-text-primary)] flex flex-col min-h-screen">
        <TrustStrip />
        <WholesaleHeader />
        <main id="main-content" tabIndex={-1} className="flex-grow">
          {children}
        </main>
        <WholesaleFooter />
      </body>
    </html>
  );
}
