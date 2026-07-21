import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Odhvica Wholesale | B2B Partnership',
  description:
    'Partner with Odhvica for wholesale and bulk orders. Exclusive pricing for retailers and distributors worldwide.',
};

export default function WholesaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-surface-paper text-primary">
        {children}
      </body>
    </html>
  );
}
