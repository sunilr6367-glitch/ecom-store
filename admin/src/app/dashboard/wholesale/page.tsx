'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Crown,
  DollarSign,
  Package,
  ShoppingBag,
  Truck,
  Users,
} from 'lucide-react';

interface WholesaleInquiry {
  id: string;
  company_name: string;
  contact_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface WholesaleOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  currency_code: string;
  created_at: string;
  customer: {
    company_name: string | null;
    email: string;
  } | null;
}

interface TierStat {
  tier: string;
  slug: string;
  customerCount: number;
  orderCount: number;
  discountPercent: number;
}

export default function WholesaleOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [inquiryStats, setInquiryStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    starter: 0,
    growth: 0,
    enterprise: 0,
  });
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    total_value: 0,
  });
  const [tierStats, setTierStats] = useState<TierStat[]>([]);
  const [latestInquiries, setLatestInquiries] = useState<WholesaleInquiry[]>([]);
  const [latestOrders, setLatestOrders] = useState<WholesaleOrder[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [
          inquiriesOverview,
          customersOverview,
          ordersOverview,
          inquiriesResult,
          ordersResult,
          tiersOverview,
        ] = await Promise.all([
          api.getWholesaleStats(),
          api.getWholesaleCustomerStats(),
          api.getWholesaleOrderStats(),
          api.getWholesaleInquiries(undefined, undefined, 1, 5),
          api.getWholesaleOrders(undefined, 1, 5),
          api.getWholesaleTierStats(),
        ]);

        setInquiryStats(
          inquiriesOverview || {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
          }
        );
        setCustomerStats(
          customersOverview || {
            total: 0,
            starter: 0,
            growth: 0,
            enterprise: 0,
          }
        );
        setOrderStats(
          ordersOverview || {
            total: 0,
            pending: 0,
            processing: 0,
            completed: 0,
            total_value: 0,
          }
        );
        setLatestInquiries(inquiriesResult?.inquiries || []);
        setLatestOrders(ordersResult?.orders || []);
        setTierStats(tiersOverview?.stats || []);
      } catch (error) {
        console.error('Error loading wholesale overview:', error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const formatCurrency = (amount: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount / 100);

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <div className="h-10 w-72 animate-pulse rounded-xl bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl bg-gray-200"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">
            Wholesale workspace
          </p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">
            B2B Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Separate command center for wholesale inquiries, approved accounts,
            orders, and pricing tiers.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/wholesale/inquiries"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:opacity-90"
          >
            Review inquiries <ArrowRight size={14} />
          </Link>
          <Link
            href="/dashboard/wholesale/orders"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-800 transition hover:bg-slate-50"
          >
            View orders
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Pending Inquiries',
            value: inquiryStats.pending,
            sub: `${inquiryStats.total} total applications`,
            icon: ClipboardList,
          },
          {
            label: 'Wholesale Customers',
            value: customerStats.total,
            sub: `${customerStats.enterprise} enterprise accounts`,
            icon: Users,
          },
          {
            label: 'Wholesale Orders',
            value: orderStats.total,
            sub: `${orderStats.pending} pending approval`,
            icon: ShoppingBag,
          },
          {
            label: 'Pipeline Value',
            value: formatCurrency(orderStats.total_value || 0),
            sub: `${orderStats.completed} completed orders`,
            icon: DollarSign,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-3 text-3xl font-black text-slate-950">
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{card.sub}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Latest Inquiries
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Applications waiting on review
              </h2>
            </div>
            <Link
              href="/dashboard/wholesale/inquiries"
              className="text-xs font-bold uppercase tracking-widest text-slate-700"
            >
              Open queue
            </Link>
          </div>
          <div className="space-y-3">
            {latestInquiries.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                No wholesale inquiries yet.
              </div>
            ) : (
              latestInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {inquiry.company_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {inquiry.contact_name} -{' '}
                      {new Date(inquiry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                      inquiry.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : inquiry.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {inquiry.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Tiers
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Active wholesale programs
              </h2>
            </div>
            <Link
              href="/dashboard/wholesale/tiers"
              className="text-xs font-bold uppercase tracking-widest text-slate-700"
            >
              Manage
            </Link>
          </div>
          <div className="space-y-3">
            {tierStats.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                No tier data available.
              </div>
            ) : (
              tierStats.map((tier) => (
                <div
                  key={tier.slug}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                        <Crown size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {tier.tier}
                        </p>
                        <p className="text-xs text-slate-500">
                          {tier.discountPercent}% discount
                        </p>
                      </div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      {tier.customerCount} customers
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Quick Actions
          </p>
          <div className="mt-5 grid gap-3">
            {[
              {
                href: '/dashboard/wholesale/inquiries',
                label: 'Review pending applications',
                icon: ClipboardList,
              },
              {
                href: '/dashboard/wholesale/customers',
                label: 'Adjust customer tiers',
                icon: Building2,
              },
              {
                href: '/dashboard/wholesale/orders',
                label: 'Process wholesale orders',
                icon: Package,
              },
              {
                href: '/dashboard/wholesale/page-content',
                label: 'Update wholesale landing page',
                icon: Truck,
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span className="text-sm font-semibold">{action.label}</span>
                  </div>
                  <ArrowRight size={15} />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Recent Orders
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Latest wholesale activity
              </h2>
            </div>
            <Link
              href="/dashboard/wholesale/orders"
              className="text-xs font-bold uppercase tracking-widest text-slate-700"
            >
              Show all
            </Link>
          </div>
          <div className="space-y-3">
            {latestOrders.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                No wholesale orders found.
              </div>
            ) : (
              latestOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      #{order.order_number}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.customer?.company_name || order.customer?.email || 'Unknown customer'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(order.total, order.currency_code)}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {order.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
