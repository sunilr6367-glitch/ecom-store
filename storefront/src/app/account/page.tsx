'use client';


import { Heading } from '@/design-system';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { OrderWithDetails } from '@/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Package, User, LogOut, MapPin, Bell } from 'lucide-react';
import { UserCard } from '@/components/account/UserCard';
import { QuickGrid } from '@/components/account/QuickGrid';
import { SettingsList } from '@/components/account/SettingsList';
import { Badge } from '@/design-system';
import { Button, ButtonLink } from '@/design-system';
import { Card } from '@/design-system';
import { EmptyState } from '@/design-system';
import { AccountSkeleton } from '@/design-system';
import { getOrderStatusBadgeClass, getOrderStatusConfig } from '@/lib/order-status';

export default function AccountPage() {
  const { customer, loading, logout } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // UX-001: Guard against race condition; only fetch orders after auth is confirmed.
  useEffect(() => {
    if (loading || !customer) return;
    api
      .getCustomerOrders()
      .then((data) => {
        setOrders(data.orders || []);
        setOrdersLoading(false);
      })
      .catch(() => {
        setOrders([]);
        setOrdersLoading(false);
      });
  }, [customer, loading]);

  if (loading) return <AccountSkeleton />;

  if (!customer) {
    return (
      <div className="min-h-screen bg-parchment px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-2xl">
          <EmptyState
            icon={<User size={42} />}
            title="Sign in to view your account."
            description="Orders, addresses, wishlist, notifications, and profile settings are available after login."
            className="rounded-lg bg-surface-paper"
            actions={
              <>
                <ButtonLink href="/login?redirect=/account" variant="secondary" size="md">
                  Sign In
                </ButtonLink>
                <ButtonLink href="/register" variant="outline" size="md">
                  Create Account
                </ButtonLink>
              </>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Header */}
        <div className="bg-surface-paper border-b border-border-subtle sticky top-0 z-10">
          <div className="px-4 h-14 flex items-center justify-center">
            <Heading role="page" className="account-mobile-title">Profile</Heading>
          </div>
        </div>

        {/* User Card */}
        <UserCard
          firstName={customer.first_name || ''}
          lastName={customer.last_name || ''}
          email={customer.email || ''}
        />

        {/* Quick Access Grid */}
        <QuickGrid />

        {/* Settings List */}
        <div className="mt-4">
          <SettingsList />
        </div>

        {/* Spacer for bottom nav */}
        <div className="h-20" />
      </div>

      {/* Desktop Layout */}
      <div className="hidden pb-16 pt-16 md:block lg:pb-24 lg:pt-24">
        <div className="ds-page-container mx-auto max-w-page">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-16">
            {/* Sidebar */}
            <div className="lg:w-64 shrink-0">
              <Card className="sticky top-24 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border-subtle">
                  <div className="w-16 h-16 bg-surface-soft rounded-full flex items-center justify-center mb-4">
                    <User size={24} className="text-muted" />
                  </div>
                  <p className="account-name">
                    {customer.first_name} {customer.last_name}
                  </p>
                  <p className="account-muted">{customer.email}</p>
                </div>
                <nav className="p-4">
                  <Link
                    href="/account"
                    className="account-nav-link block bg-parchment px-4 py-2 mb-1"
                  >
                    Overview
                  </Link>
                  <Link
                    href="/account/orders"
                    className="account-nav-link block px-4 py-2 hover:bg-parchment hover:text-primary mb-1"
                  >
                    Orders
                  </Link>
                  <Link
                    href="/account/profile"
                    className="account-nav-link block px-4 py-2 hover:bg-parchment hover:text-primary mb-1"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/account/addresses"
                    className="account-nav-link mb-1 flex items-center gap-2 px-4 py-2 hover:bg-parchment hover:text-primary"
                  >
                    <MapPin size={14} /> Addresses
                  </Link>
                  <Link
                    href="/account/notifications"
                    className="account-nav-link mb-1 flex items-center gap-2 px-4 py-2 hover:bg-parchment hover:text-primary"
                  >
                    <Bell size={14} /> Notifications
                  </Link>
                  <Button
                    type="button"
                    onClick={logout}
                    variant="ghost"
                    size="sm"
                    fullWidth
                    className="account-nav-danger mt-4 justify-start gap-2 px-4 py-2 text-left normal-case hover:bg-danger-bg"
                  >
                    <LogOut size={14} /> Sign Out
                  </Button>
                </nav>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <Heading role="page" className="account-page-title mb-8">
                My Account
              </Heading>

              {/* Quick Stats */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Package size={20} className="text-muted" />
                    <p className="account-kicker">
                      Total Orders
                    </p>
                  </div>
                  <p className="account-stat-value">
                    {orders.length}
                  </p>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <User size={20} className="text-muted" />
                    <p className="account-kicker">
                      Member Since
                    </p>
                  </div>
                  <p className="account-stat-date">
                    {customer.created_at
                      ? new Date(customer.created_at).toLocaleDateString(
                          'en-US',
                          { month: 'short', year: 'numeric' }
                        )
                      : 'N/A'}
                  </p>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card className="overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                  <h2 className="account-section-title">
                    Recent Orders
                  </h2>
                  <Link
                    href="/account/orders"
                    className="account-muted hover:text-primary"
                  >
                    View All
                  </Link>
                </div>

                {ordersLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <EmptyState
                    icon={<Package size={48} />}
                    title="No orders yet"
                    className="border-0"
                    actions={
                    <ButtonLink href="/" variant="secondary" size="md">
                      Start Shopping
                    </ButtonLink>
                    }
                  />
                ) : (
                  <div className="divide-y divide-[var(--ds-border-subtle)]">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="p-6 flex items-center justify-between hover:bg-parchment transition-colors"
                      >
                        <div>
                          <Link
                            href={`/account/orders/${order.id}`}
                            className="account-name hover:text-secondary"
                          >
                            Order #{order.display_id}
                          </Link>
                          <p className="account-muted mt-1">
                            {new Date(order.created_at).toLocaleDateString(
                              'en-US',
                              { month: 'long', day: 'numeric', year: 'numeric' }
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="account-name">
                            {new Intl.NumberFormat(undefined, {
                              style: 'currency',
                              currency:
                                order.currency_code?.toUpperCase() || 'INR',
                            }).format(order.total / 100)}
                          </span>
                          <Badge
                            className={`account-status-badge px-3 py-1 ${getOrderStatusBadgeClass(order.status)}`}
                          >
                            {getOrderStatusConfig(order.status).label}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
