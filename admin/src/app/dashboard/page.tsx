'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

/* ── Types (unchanged from original) ── */
interface DashboardStats {
  total_sales?: number;
  total_orders?: number;
  total_customers?: number;
  average_order_value?: number;
}
interface ProductStats {
  total_products: number;
  published_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
}
interface CustomerStats {
  total_customers: number;
  new_this_month: number;
}
interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  currency_code: string;
  customer_first_name: string | null;
  customer_last_name: string | null;
  email: string;
  created_at: string;
}
interface SalesPoint {
  date: string;
  sales?: number;
  revenue?: number;
  orders?: number;
}

/* ── Status badge helper ── */
const STATUS_STYLE: Record<string, { badge: string; border: string }> = {
  paid:       { badge: 'bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]', border: 'border-[var(--tertiary-container)]' },
  completed:  { badge: 'bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]', border: 'border-[var(--tertiary-container)]' },
  pending:    { badge: 'bg-[var(--secondary-container)] text-[var(--on-secondary-container)]', border: 'border-[var(--secondary-container)]' },
  processing: { badge: 'bg-[var(--secondary-container)] text-[var(--on-secondary-container)]', border: 'border-[var(--secondary-container)]' },
  shipped:    { badge: 'bg-[var(--primary-fixed)] text-[var(--on-primary-fixed-variant)]', border: 'border-[var(--primary-fixed)]' },
  cancelled:  { badge: 'bg-[var(--error-container)] text-[var(--on-error-container)]', border: 'border-[var(--error-container)]' },
};
function getStatusStyle(status: string) {
  return STATUS_STYLE[status.toLowerCase()] ?? STATUS_STYLE.pending;
}

/* ── Formatting helpers ── */
function fmtCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount / 100);
}
function fmtDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}
function fmtCompact(n: number) {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)   return `₹${(n / 1_000).toFixed(1)}k`;
  return `₹${n}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics]       = useState<DashboardStats | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [salesTrend, setSalesTrend]     = useState<SalesPoint[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [overview, products, customers, orders, trend, statuses] =
          await Promise.all([
            api.getAnalyticsOverview(),
            api.getProductStats(),
            api.getCustomerStats(),
            api.getOrders(10, 0),
            api.getSalesTrend(7),
            api.getOrdersByStatus(),
          ]);
        setAnalytics(overview || null);
        setProductStats(products || null);
        setCustomerStats(customers || null);
        setRecentOrders(orders?.orders || orders || []);
        setSalesTrend(Array.isArray(trend) ? trend : []);
        const counts: Record<string, number> = {};
        (Array.isArray(statuses) ? statuses : []).forEach(
          (s: { status: string; count: number }) => { counts[s.status] = s.count; }
        );
        setStatusCounts(counts);
      } catch (e) {
        console.error('Dashboard load error', e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const monthRevenue = salesTrend.reduce((s, p) => s + (p.sales || p.revenue || 0), 0)
    || analytics?.total_sales || 0;
  const monthOrders = salesTrend.reduce((s, p) => s + (p.orders || 0), 0)
    || analytics?.total_orders || 0;
  const pendingOrders = statusCounts.pending || 0;
  const maxBar = Math.max(...salesTrend.map(p => p.sales || p.revenue || 0), 1);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-8 px-4 py-6 md:px-6">
        <div>
          <div className="h-10 w-48 bg-[var(--surface-container-high)] rounded-xl animate-pulse" />
          <div className="h-4 w-64 bg-[var(--surface-container)] rounded-xl animate-pulse mt-3" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[var(--surface-container-lowest)] rounded-xl animate-pulse shadow-[0_4px_12px_rgba(25,28,30,0.04)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 py-6 md:px-6">

      {/* ── Page heading ── */}
      <section>
        <h2 className="text-[2.75rem] font-black leading-none tracking-tight text-[var(--on-surface)]">
          Overview
        </h2>
        <p className="mt-2 text-sm font-medium text-[var(--on-surface-variant)]">
          Performance tracking for the last 7 days.
        </p>
      </section>

      {/* ── Stats bento grid ── */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: '₹', label: 'Revenue', value: fmtCompact(monthRevenue / 100) },
          { icon: '🛍', label: 'Orders', value: monthOrders.toLocaleString('en-IN') },
          { icon: '⏳', label: 'Pending', value: pendingOrders, warn: pendingOrders > 0 },
          { icon: '📦', label: 'Products', value: productStats?.published_products ?? 0 },
        ].map((card) => (
          <div
            key={card.label}
            className={`bg-[var(--surface-container-lowest)] p-5 rounded-xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] flex flex-col gap-3 ${
              card.warn ? 'ring-1 ring-[var(--error)]/30' : ''
            }`}
          >
            <span className="text-2xl leading-none">{card.icon}</span>
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">
                {card.label}
              </p>
              <p className={`text-xl font-black mt-0.5 ${card.warn ? 'text-[var(--error)]' : 'text-[var(--on-surface)]'}`}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Revenue highlight card ── */}
      <section className="bg-[var(--primary)] text-white p-6 rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--on-tertiary-container)]/20 blur-3xl -mr-16 -mt-16 rounded-full" />
        <div className="relative z-10">
          <p className="text-[0.6875rem] font-bold uppercase tracking-widest opacity-60">
            Revenue trend — last 7 days
          </p>
          <h3 className="text-3xl font-black mt-1">
            {fmtCurrency(monthRevenue, analytics ? 'INR' : 'INR')}
          </h3>

          <div className="mt-8 flex justify-between items-end gap-2">
            {/* Mini bar chart from real salesTrend */}
            <div className="flex items-end gap-1.5 h-14 flex-1">
              {salesTrend.length > 0
                ? salesTrend.map((p) => {
                    const val = p.sales || p.revenue || 0;
                    const pct = Math.max((val / maxBar) * 100, 8);
                    return (
                      <div
                        key={p.date}
                        className="flex-1 rounded-full bg-white/20"
                        style={{ height: `${pct}%` }}
                        title={fmtDate(p.date)}
                      />
                    );
                  })
                : [40, 60, 48, 75, 85, 70, 90].map((h, i) => (
                    <div key={i} className="flex-1 rounded-full bg-white/20" style={{ height: `${h}%` }} />
                  ))}
            </div>
            <Link
              href="/dashboard/analytics"
              className="flex-shrink-0 bg-[var(--secondary-container)] text-[var(--on-secondary-container)] px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest"
            >
              View Report
            </Link>
          </div>
        </div>
      </section>

      {/* ── Quick actions ── */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Add Product',    sub: 'New listing',         href: '/dashboard/products/new' },
          { label: 'View Orders',    sub: 'Fulfillment queue',   href: '/dashboard/orders' },
          { label: 'Category Circles', sub: 'Mobile shortcuts', href: '/dashboard/content/category-circles' },
          { label: 'Add Coupon',     sub: 'Discounts & deals',   href: '/dashboard/marketing' },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="bg-[var(--surface-container-lowest)] rounded-xl p-4 shadow-[0_4px_12px_rgba(25,28,30,0.04)] hover:shadow-[0_8px_24px_rgba(25,28,30,0.08)] hover:bg-[var(--surface-container-low)] transition-all active:scale-95"
          >
            <p className="text-xs font-bold text-[var(--on-surface)]">{a.label}</p>
            <p className="text-[10px] text-[var(--on-surface-variant)] mt-0.5">{a.sub}</p>
          </Link>
        ))}
      </section>

      {/* ── Recent orders ── */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--on-surface)]">
            Recent Orders
          </h3>
          <Link href="/dashboard/orders" className="text-[10px] font-bold text-[var(--on-tertiary-container)]">
            Show All
          </Link>
        </div>

        <div className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] divide-y divide-[var(--surface-container-low)]">
          {recentOrders.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-[var(--on-surface-variant)]">
              No orders yet.
            </p>
          ) : (
            recentOrders.slice(0, 8).map((order) => {
              const s = getStatusStyle(order.status);
              const name =
                order.customer_first_name && order.customer_last_name
                  ? `${order.customer_first_name} ${order.customer_last_name}`
                  : order.email;
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  className={`w-full flex items-center justify-between p-4 border-l-4 ${s.border} text-left hover:bg-[var(--surface-container-low)]/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl active:scale-[0.99]`}
                >
                  <div>
                    <span className="text-xs font-bold text-[var(--on-surface)] block">
                      #{order.order_number}
                    </span>
                    <span className="text-[10px] text-[var(--on-surface-variant)]">
                      {name}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs font-black text-[var(--on-surface)]">
                      {fmtCurrency(order.total, order.currency_code || 'INR')}
                    </span>
                    <span className={`${s.badge} px-2 py-0.5 rounded-full text-[9px] font-bold uppercase`}>
                      {order.status}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* ── Snapshot stats ── */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="bg-[var(--surface-container-lowest)] rounded-xl p-5 shadow-[0_4px_12px_rgba(25,28,30,0.04)] space-y-3">
          <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">
            Store Snapshot
          </p>
          {[
            { label: 'Total customers', value: customerStats?.total_customers || analytics?.total_customers || 0 },
            { label: 'New this month',  value: customerStats?.new_this_month || 0 },
            { label: 'Avg order value', value: fmtCurrency(analytics?.average_order_value || 0) },
            { label: 'Inventory alerts', value: (productStats?.low_stock_products || 0) + (productStats?.out_of_stock_products || 0) },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-xl bg-[var(--surface-container-low)] px-4 py-3">
              <span className="text-xs text-[var(--on-surface-variant)]">{row.label}</span>
              <span className="text-xs font-bold text-[var(--on-surface)]">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="bg-[var(--surface-container-lowest)] rounded-xl p-5 shadow-[0_4px_12px_rgba(25,28,30,0.04)]">
          <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)] mb-4">
            Order Status
          </p>
          <div className="space-y-3">
            {[
              { label: 'Pending',    key: 'pending',    style: 'bg-[var(--secondary-container)]' },
              { label: 'Processing', key: 'processing', style: 'bg-[var(--secondary-container)]' },
              { label: 'Shipped',    key: 'shipped',    style: 'bg-[var(--primary-fixed)]' },
              { label: 'Completed',  key: 'completed',  style: 'bg-[var(--tertiary-container)]' },
              { label: 'Cancelled',  key: 'cancelled',  style: 'bg-[var(--error-container)]' },
            ].map((row) => {
              const count = statusCounts[row.key] || 0;
              const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={row.key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] font-medium text-[var(--on-surface-variant)]">{row.label}</span>
                    <span className="text-[10px] font-bold text-[var(--on-surface)]">{count}</span>
                  </div>
                  <div className="h-1.5 bg-[var(--surface-container-high)] rounded-full overflow-hidden">
                    <div className={`h-full ${row.style} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
