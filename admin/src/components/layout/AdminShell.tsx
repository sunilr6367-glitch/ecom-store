'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import MobileBottomTab from '@/components/layout/MobileBottomTab';

const DASHBOARD_MODE_STORAGE_KEY = 'kvastram.dashboardMode';
const WHOLESALE_COUPONS_ROUTE = '/dashboard/wholesale/tiers';
const LEGACY_WHOLESALE_ROUTES: Record<string, string> = {
  '/dashboard/settings/tiers': '/dashboard/wholesale/tiers',
  '/dashboard/content/footer-links': '/dashboard/wholesale/footer-links',
  '/dashboard/wholesale-page': '/dashboard/wholesale/page-content',
};

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [drawerState, setDrawerState] = useState({
    open: false,
    pathname,
  });

  const isDashboardRoute = pathname.startsWith('/dashboard');
  const drawerOpen = drawerState.open && drawerState.pathname === pathname;

  const openDrawer = () => {
    setDrawerState({ open: true, pathname });
  };

  const closeDrawer = () => {
    setDrawerState({ open: false, pathname });
  };

  useEffect(() => {
    if (!isDashboardRoute) return;

    const savedMode = window.sessionStorage.getItem(DASHBOARD_MODE_STORAGE_KEY);
    const wholesaleRedirect = LEGACY_WHOLESALE_ROUTES[pathname];

    if (wholesaleRedirect) {
      window.sessionStorage.setItem(DASHBOARD_MODE_STORAGE_KEY, 'wholesale');
      router.replace(wholesaleRedirect);
      return;
    }

    if (pathname.startsWith('/dashboard/wholesale')) {
      window.sessionStorage.setItem(DASHBOARD_MODE_STORAGE_KEY, 'wholesale');
      return;
    }

    if (pathname === '/dashboard') {
      window.sessionStorage.setItem(DASHBOARD_MODE_STORAGE_KEY, 'retail');
      return;
    }

    if (pathname.startsWith('/dashboard/marketing') && savedMode === 'wholesale') {
      router.replace(WHOLESALE_COUPONS_ROUTE);
    }
  }, [isDashboardRoute, pathname, router]);

  useEffect(() => {
    if (!isDashboardRoute || authLoading || !user) return;

    let active = true;
    const load = async () => {
      try {
        const stats = await api.getOrderStats();
        if (active) setPendingOrders(stats?.pending_orders || 0);
      } catch {
        // Non-critical dashboard badge refresh.
      }
    };

    void load();
    const id = window.setInterval(load, 45_000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [authLoading, isDashboardRoute, pathname, user]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerState((current) =>
          current.open ? { open: false, pathname } : current
        );
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pathname]);

  if (!isDashboardRoute) return <>{children}</>;

  return (
    <ProtectedRoute>
      <div
        data-admin-shell
        className="min-h-screen bg-[var(--surface)] text-[var(--on-surface)]"
      >
        <div
          onClick={closeDrawer}
          className={`fixed inset-0 z-[60] bg-[var(--primary)]/40 backdrop-blur-sm transition-opacity duration-300 ${
            drawerOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          }`}
        />

        <Sidebar
          pendingOrders={pendingOrders}
          isOpen={drawerOpen}
          onClose={closeDrawer}
        />

        <div className="relative min-h-screen md:pl-[240px]">
          <TopHeader onMenuOpen={openDrawer} />

          <main className="min-h-screen pb-28 pt-20 md:pb-10 md:pt-[72px]">
            <div className="mx-auto max-w-[1560px] page-fade" key={pathname}>
              {children}
            </div>
          </main>
        </div>

        <MobileBottomTab
          pendingOrders={pendingOrders}
          isDrawerOpen={drawerOpen}
          onOpenDrawer={openDrawer}
          onCloseDrawer={closeDrawer}
        />
      </div>
    </ProtectedRoute>
  );
}
