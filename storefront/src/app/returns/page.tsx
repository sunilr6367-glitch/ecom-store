'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  InfoCard,
  InlineCTA,
  PageHero,
} from '@/components/content/ContentPageSystem';
import { Badge } from '@/design-system';
import { EmptyState } from '@/design-system';
import { StatusBanner } from '@/design-system';
import { storefrontTrust } from '@/config/storefront-trust';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';

type CustomerReturn = {
  id: string;
  order_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded' | string;
  refund_amount?: number | null;
  admin_notes?: string | null;
  created_at: string;
};

type CustomerOrder = {
  id: string;
  display_id: string;
  status: string;
  raw_status?: string | null;
  created_at: string;
  total: number;
  currency_code?: string | null;
};

function getReturnStatusClasses(status: string) {
  switch (status) {
    case 'approved':
      return 'border-success bg-success-bg text-success';
    case 'refunded':
      return 'kv-status-subtle';
    case 'rejected':
      return 'border-danger bg-danger-bg text-error';
    default:
      return 'border-warning bg-warning-bg text-warning-text';
  }
}

export default function ReturnsPage() {
  const { customer, loading } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [returns, setReturns] = useState<CustomerReturn[]>([]);

  useEffect(() => {
    if (loading || !customer) {
      return;
    }

    Promise.all([api.getCustomerOrders(), api.getCustomerReturns()])
      .then(([ordersData, returnsData]) => {
        setOrders(ordersData.orders || []);
        setReturns(returnsData.returns || []);
      })
      .catch(() => {
        setOrders([]);
        setReturns([]);
      });
  }, [customer, loading]);

  const eligibleOrders = useMemo(() => {
    const returnOrderIds = new Set(returns.map((item) => item.order_id));
    return orders.filter(
      (order) =>
        (order.status === 'delivered' || order.raw_status === 'completed') &&
        !returnOrderIds.has(order.id)
    );
  }, [orders, returns]);

  return (
    <>
      <PageHero
        eyebrow="Returns Support"
        title="Returns, Refunds, and Exchanges"
        intro="Use this page before or after purchase to understand how Odhvica handles eligible return, refund, and cancellation requests."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Returns' },
        ]}
      />
      <div className="content-page-band">
      <div className="content-shell max-w-4xl py-token-xl md:py-token-2xl lg:py-token-3xl">
        <StatusBanner tone="info" className="mb-8">
          <p className="font-semibold">
            Refunds are processed within 3–7 business days to the original payment method after return approval.
          </p>
          <p className="mt-1 text-body-sm">
            UPI: 3–5 business days. Cards/Net Banking: 5–7 business days.
          </p>
        </StatusBanner>

        <div className="info-grid">
          <InfoCard title="Before delivery" eyebrow="Cancellation">
            If your order has not shipped yet, contact support as early as
            possible for cancellation help.
          </InfoCard>
          <InfoCard title="After delivery" eyebrow="Eligibility">
            Returns and refunds depend on item condition, product type, and
            policy eligibility. Keep the product unworn and in original
            packaging.
          </InfoCard>
          <InfoCard title="Need a response?" eyebrow="Support">
            Include your order reference, email, and reason for the request
            when you contact support.
          </InfoCard>
        </div>

        <div className="mt-12 border border-border-subtle p-8">
          <h2 className="text-display-sm font-display text-primary">
            How to start a request
          </h2>
          <ol className="mt-6 list-decimal space-y-3 pl-5 text-body-md text-secondary">
            <li>Keep your order number ready.</li>
            <li>Review the refund policy before opening a request.</li>
            <li>Contact support with your order details and product issue.</li>
            <li>Wait for eligibility confirmation before sending anything back.</li>
          </ol>
        </div>

        <div className="mt-12 border border-border-subtle p-8">
          <h2 className="text-display-sm font-display text-primary">
            Self-serve returns
          </h2>
          <p className="mt-3 text-body-md text-secondary">
            Signed-in customers can track existing return requests and open an
            eligible delivered order to request a new return.
          </p>

          {loading ? (
            <p className="mt-6 text-body-sm text-muted">
              Loading your return activity...
            </p>
          ) : !customer ? (
            <StatusBanner tone="info" className="mt-6">
              <div>
                Sign in to view your return requests and open eligible delivered
                orders without contacting support first.
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="bg-primary px-5 py-3 text-body-xs font-bold  tracking-token-wider text-inverse transition-colors hover:bg-secondary"
                >
                  Sign In
                </Link>
                <Link
                  href="/account/orders"
                  className="border border-border px-5 py-3 text-body-xs font-bold  tracking-token-wider text-primary transition-colors hover:bg-parchment"
                >
                  My Orders
                </Link>
              </div>
            </StatusBanner>
          ) : (
            <div className="mt-6 space-y-8">
              <div>
                <h3 className="text-body-lg font-semibold text-primary">
                  Your return requests
                </h3>
                {returns.length > 0 ? (
                  <div className="mt-4 grid gap-4">
                    {returns
                      .slice()
                      .reverse()
                      .map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-border-subtle p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-body-sm font-semibold text-primary">
                                Return for order #{item.order_id.slice(0, 8)}
                              </p>
                              <p className="mt-1 text-body-xs text-muted">
                                Submitted{' '}
                                {new Date(item.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              className={`rounded-full border px-3 py-1 text-body-xs font-bold  tracking-token-wider ${getReturnStatusClasses(item.status)}`}
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <p className="mt-3 text-body-sm text-secondary">
                            {item.reason}
                          </p>
                          {item.admin_notes ? (
                            <p className="mt-2 text-body-sm text-muted">
                              Team note: {item.admin_notes}
                            </p>
                          ) : null}
                          <div className="mt-4 flex flex-wrap gap-3">
                            <Link
                              href={`/account/orders/${item.order_id}`}
                              className="border border-border px-4 py-2 text-body-xs font-bold  tracking-token-wider text-primary transition-colors hover:bg-parchment"
                            >
                              View Order
                            </Link>
                            <Link
                              href={`${storefrontTrust.policyRoutes.contact}?reason=returns&order=${item.order_id}`}
                              className="border border-border px-4 py-2 text-body-xs font-bold  tracking-token-wider text-primary transition-colors hover:bg-parchment"
                            >
                              Contact Support
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No return requests yet."
                    className="mt-4 py-8"
                  />
                )}
              </div>

              <div>
                <h3 className="text-body-lg font-semibold text-primary">
                  Eligible delivered orders
                </h3>
                {eligibleOrders.length > 0 ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {eligibleOrders.slice(0, 4).map((order) => (
                      <div
                        key={order.id}
                        className="rounded-lg border border-border-subtle bg-parchment p-5"
                      >
                        <p className="text-body-sm font-semibold text-primary">
                          Order #{order.display_id}
                        </p>
                        <p className="mt-1 text-body-xs text-muted">
                          Delivered order placed{' '}
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            href={`/account/orders/${order.id}`}
                            className="bg-primary px-4 py-2 text-body-xs font-bold  tracking-token-wider text-inverse transition-colors hover:bg-secondary"
                          >
                            Open Order
                          </Link>
                          <Link
                            href={storefrontTrust.policyRoutes.refundPolicy}
                            className="border border-border px-4 py-2 text-body-xs font-bold  tracking-token-wider text-primary transition-colors hover:bg-surface-paper"
                          >
                            Review Policy
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No eligible delivered orders"
                    description="We could not find a delivered order that is still awaiting a return request."
                    className="mt-4 py-8"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <InlineCTA
          title="Need help with a return?"
          body={`Support email: ${storefrontTrust.supportEmail} | Phone/WhatsApp: ${storefrontTrust.supportPhone}`}
          links={[
            { label: 'Help Center', href: storefrontTrust.policyRoutes.help },
            {
              label: 'Read Refund Policy',
              href: storefrontTrust.policyRoutes.refundPolicy,
            },
            {
              label: 'Contact Support',
              href: `${storefrontTrust.policyRoutes.contact}?reason=returns`,
              variant: 'primary',
            },
          ]}
        />
      </div>
      </div>
    </>
  );
}
