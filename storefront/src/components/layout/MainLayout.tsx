'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { WholesaleHeader } from '@/components/layout/WholesaleHeader';
import { WholesaleFooter } from '@/components/layout/WholesaleFooter';
import { CartRecovery } from '@/components/cart/CartRecovery';
import { ArrowUp } from 'lucide-react';
import { ChatWidget, CookieConsent, IconButton, NewsletterModal, PageShell, ScrollProgress } from '@/design-system';

type ChromeMode = 'store' | 'checkout' | 'wholesale';

function getChromeMode(pathname: string | null): ChromeMode {
  if (pathname?.startsWith('/wholesale')) return 'wholesale';
  if (pathname?.startsWith('/checkout')) return 'checkout';
  return 'store';
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    const syncViewport = () => {
      setIsMobile(mediaQuery.matches);
      if (mediaQuery.matches) {
        setVisible(false);
      } else {
        setVisible(window.scrollY > 500);
      }
    };

    const onScroll = () => {
      if (!mediaQuery.matches) {
        setVisible(window.scrollY > 500);
      }
    };

    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      mediaQuery.removeEventListener('change', syncViewport);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (isMobile || !visible) return null;

  return (
    <IconButton
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      size="sm"
      variant="primary"
      className="fixed bottom-24 right-5 z-50 rounded-full shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-secondary md:bottom-8 md:right-8 animate-scale-in"
    >
      <ArrowUp size={18} />
    </IconButton>
  );
}

export function MainLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const pathname = usePathname();
  const chromeMode = getChromeMode(pathname);
  const isStorePage = chromeMode === 'store';
  const isWholesalePage = chromeMode === 'wholesale';
  const isDesignSystemLab = pathname === '/__design-system';
  const showStoreChrome = isStorePage && !isDesignSystemLab;
  const showStoreOverlays = isStorePage && !isDesignSystemLab;

  return (
    <>
      {showStoreChrome ? <ScrollProgress /> : null}
      {isWholesalePage ? <WholesaleHeader /> : null}
      {showStoreChrome ? <SiteHeader /> : null}
      <main id="main-content" tabIndex={-1} className="page-transition">
        <PageShell>{children}</PageShell>
      </main>
      {isWholesalePage ? <WholesaleFooter /> : null}
      {showStoreChrome ? <Footer /> : null}
      {showStoreChrome && <BottomNav />}
      {showStoreOverlays && <ScrollToTop />}
      {showStoreOverlays && <CartRecovery />}
      {showStoreOverlays && <CookieConsent />}
      {showStoreOverlays && <NewsletterModal />}
      {showStoreOverlays && <ChatWidget />}
    </>
  );
}
