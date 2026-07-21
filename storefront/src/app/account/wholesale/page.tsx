'use client';


import { Heading } from '@/design-system';
import { useAuth } from '@/context/auth-context';
import { useWholesale } from '@/context/wholesale-context';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Tag,
  TrendingUp,
  Clock,
  Building2,
} from 'lucide-react';
import { Badge } from '@/design-system';
import { ButtonLink } from '@/design-system';
import { Card } from '@/design-system';
import { EmptyState } from '@/design-system';

interface WholesaleOrder {
  id: string;
  display_id?: string;
  total: number;
  currency_code?: string;
  status: string;
  payment_status?: string;
  created_at: string;
  metadata?: {
    po_number?: string;
    payment_terms?: string;
  };
}

export default function WholesaleDashboardPage() {
  const { customer, loading } = useAuth();
  const { wholesaleInfo, loading: wholesaleLoading } = useWholesale();
  const router = useRouter();
  const [orders, setOrders] = useState<WholesaleOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !customer) {
      router.push('/login');
    }
  }, [loading, customer, router]);

  useEffect(() => {
    api
      .getCustomerOrders()
      .then((data) => {
        setOrders(data?.orders || []);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => {
        setOrdersLoading(false);
      });
  }, []);

  if (loading || wholesaleLoading || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!wholesaleInfo?.hasWholesaleAccess) {
    return (
      <div className="kv-page-gutter flex min-h-screen items-center justify-center bg-parchment px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <EmptyState
          icon={<Building2 size={48} />}
          title="No Wholesale Access"
          description="You don't have wholesale access yet. Apply for a wholesale account to get started."
          className="max-w-md"
          actions={
          <ButtonLink href="/wholesale" variant="secondary" size="md">
            Apply for Wholesale
          </ButtonLink>
          }
        />
      </div>
    );
  }

  const tierColors: Record<string, string> = {
    starter: 'border-info bg-info-bg text-info-text',
    growth: 'border-success bg-success-bg text-success',
    enterprise: 'border-accent bg-accent-soft text-accent-hover',
  };

  const tierColor =
    tierColors[wholesaleInfo.tier || ''] ||
    'bg-parchment text-secondary border-border-subtle';

  return (
    <div className="min-h-screen bg-parchment">
      <div className="mx-auto max-w-4xl px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <div className="mb-6">
          <Link
            href="/account"
            className="account-muted inline-flex items-center gap-2 transition-colors hover:text-primary"
          >
            <ArrowLeft size={16} /> Back to Account
          </Link>
        </div>

        <Heading role="page" className="account-detail-title mb-8">
          Wholesale Dashboard
        </Heading>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 lg:gap-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Tag size={20} className="text-muted" />
              <span className="account-form-label">
                Your Tier
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={`account-status-badge border px-3 py-1 ${tierColor}`}
              >
                {wholesaleInfo.tier || 'N/A'}
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp size={20} className="text-muted" />
              <span className="account-form-label">
                Discount
              </span>
            </div>
            <p className="account-detail-title">
              {wholesaleInfo.discountPercent}%
            </p>
            <p className="account-caption mt-1">Off retail prices</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Building2 size={20} className="text-muted" />
              <span className="account-form-label">
                Company
              </span>
            </div>
            <p className="account-section-title">
              {wholesaleInfo.companyName || 'N/A'}
            </p>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="p-6 border-b border-border-subtle">
            <div className="flex items-center justify-between">
              <h2 className="account-kicker flex items-center gap-2">
                <Package size={16} /> Recent Orders
              </h2>
              <Link
                href="/account/orders"
                className="account-caption  transition-colors hover:text-primary"
              >
                View All
              </Link>
            </div>
          </div>

          {ordersLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              className="border-0"
              actions={
              <Link
                href="/collections"
                className="account-name mt-2 inline-block underline"
              >
                Browse Products
              </Link>
              }
            />
          ) : (
            <div className="divide-y divide-[var(--ds-border-subtle)]">
              {orders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between p-4 hover:bg-parchment transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="account-name">
                        Order #{order.display_id || order.id.slice(0, 8)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-muted" />
                        <span className="account-caption">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        {order.metadata?.po_number && (
                          <span className="account-caption">
                            PO: {order.metadata.po_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="account-name">
                      {new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: order.currency_code?.toUpperCase() || 'INR',
                      }).format(order.total / 100)}
                    </p>
                    <Badge
                      className={`account-caption  ${
                        order.status === 'completed'
                          ? 'text-success'
                          : order.status === 'canceled'
                            ? 'text-error'
                            : 'text-warning-text'
                      }`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
