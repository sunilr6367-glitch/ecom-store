'use client';

import { useEffect, useState } from 'react';
import { Package, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { api } from '@/lib/api';

interface SalesPoint {
  date: string;
  sales?: number;
  revenue?: number;
  orders?: number;
}

interface StatusPoint {
  status: string;
  count: number;
}

interface AnalyticsOverview {
  total_sales?: number;
  total_orders?: number;
  average_order_value?: number;
  total_customers?: number;
}

interface CustomerOverview {
  total_customers?: number;
  new_this_month?: number;
}

interface ProductPreview {
  id: string;
  title: string;
  thumbnail: string | null;
  total_inventory: number;
}

const BAR_COLORS = ['#5080ff', '#fed488', '#4fd1c5', '#68d391', '#fc8181', '#b794f4'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<SalesPoint[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<SalesPoint[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusPoint[]>([]);
  const [productPreview, setProductPreview] = useState<ProductPreview[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerOverview | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [overviewData, weeklyData, monthlyData, statuses, products, customers] =
          await Promise.all([
            api.getAnalyticsOverview(),
            api.getSalesTrend(7),
            api.getSalesTrend(30),
            api.getOrdersByStatus(),
            api.getProducts(5, 0, '', 'published'),
            api.getCustomerStats(),
          ]);
        setOverview(overviewData || null);
        setWeeklyTrend(Array.isArray(weeklyData) ? weeklyData : []);
        setMonthlyTrend(Array.isArray(monthlyData) ? monthlyData : []);
        setStatusBreakdown(Array.isArray(statuses) ? statuses : []);
        setProductPreview(products?.data || products || []);
        setCustomerStats(customers || null);
      } catch (e) {
        console.error('Failed to load analytics:', e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const fmtCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100);

  const fmtDate = (value: string) =>
    new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

  const weekRevenue  = weeklyTrend.reduce((s, p) => s + (p.sales || p.revenue || 0), 0);
  const monthRevenue = monthlyTrend.reduce((s, p) => s + (p.sales || p.revenue || 0), 0);
  const weekOrders   = weeklyTrend.reduce((s, p) => s + (p.orders || 0), 0);
  const totalStatusOrders = statusBreakdown.reduce((s, p) => s + p.count, 0) || 1;
  const maxBar = Math.max(...monthlyTrend.map((p) => p.sales || p.revenue || 0), 1);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6 px-4 py-6 md:px-6">
        <div className="h-10 w-40 bg-[var(--surface-container-high)] rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[var(--surface-container-lowest)] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">

      {/* ── Heading ── */}
      <section>
        <h2 className="text-[2.75rem] font-black leading-none tracking-tight text-[var(--on-surface)]">
          Analytics
        </h2>
        <p className="mt-2 text-sm font-medium text-[var(--on-surface-variant)]">
          Revenue, status mix, and customer momentum at a glance.
        </p>
      </section>

      {/* ── KPI bento ── */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: TrendingUp, label: 'This week',    value: fmtCurrency(weekRevenue),                     sub: `${weekOrders} orders` },
          { icon: TrendingUp, label: 'This month',   value: fmtCurrency(monthRevenue),                    sub: 'Trailing 30 days' },
          { icon: ShoppingBag,label: 'All-time rev', value: fmtCurrency(overview?.total_sales || 0),      sub: `${overview?.total_orders || 0} orders total` },
          { icon: Users,      label: 'New customers',value: customerStats?.new_this_month || 0,           sub: `${customerStats?.total_customers || 0} total` },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-[var(--surface-container-lowest)] p-5 rounded-xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] flex flex-col gap-3">
              <Icon size={18} className="text-[var(--on-surface-variant)]" />
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">{card.label}</p>
                <p className="text-xl font-black mt-0.5 text-[var(--on-surface)]">{card.value}</p>
                <p className="text-[10px] text-[var(--on-surface-variant)] mt-0.5">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Revenue bar chart + status donut ── */}
      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">

        {/* Bar chart */}
        <div className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] p-5">
          <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">Revenue trend</p>
          <h3 className="text-base font-black mt-1 text-[var(--on-surface)]">Last 30 days</h3>
          <div className="mt-6 flex items-end gap-1 h-40">
            {monthlyTrend.length > 0
              ? monthlyTrend.map((p, i) => {
                  const val = p.sales || p.revenue || 0;
                  const pct = Math.max((val / maxBar) * 100, 4);
                  return (
                    <div key={p.date} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-lg transition-all duration-500"
                        style={{ height: `${pct}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length], opacity: 0.85 }}
                        title={`${fmtDate(p.date)}: ${fmtCurrency(val)}`}
                      />
                    </div>
                  );
                })
              : [40, 60, 48, 75, 85, 70, 90, 55, 65, 80].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-lg bg-[var(--surface-container-high)]" style={{ height: `${h}%` }} />
                ))}
          </div>
          {monthlyTrend.length > 0 && (
            <div className="mt-2 flex gap-1">
              {monthlyTrend.map((p) => (
                <p key={p.date} className="flex-1 text-center text-[8px] text-[var(--on-surface-variant)] truncate">{fmtDate(p.date)}</p>
              ))}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] p-5">
          <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">Status mix</p>
          <h3 className="text-base font-black mt-1 text-[var(--on-surface)]">Orders by status</h3>

          {/* Mini donut */}
          <div className="mt-4 flex justify-center">
            <div
              className="relative h-36 w-36 rounded-full"
              style={{
                background: totalStatusOrders > 1
                  ? `conic-gradient(${statusBreakdown.reduce<{ stops: string[]; cum: number }>((acc, p, i) => {
                      const start = (acc.cum / totalStatusOrders) * 100;
                      acc.cum += p.count;
                      const end = (acc.cum / totalStatusOrders) * 100;
                      acc.stops.push(`${BAR_COLORS[i % BAR_COLORS.length]} ${start}% ${end}%`);
                      return acc;
                    }, { stops: [], cum: 0 }).stops.join(', ')})`
                  : `conic-gradient(var(--surface-container-high) 0% 100%)`,
              }}
            >
              <div className="absolute inset-[14px] rounded-full bg-[var(--surface-container-lowest)] flex items-center justify-center flex-col">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">Total</p>
                <p className="text-lg font-black text-[var(--on-surface)]">{totalStatusOrders}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {statusBreakdown.map((p, i) => {
              const pct = Math.round((p.count / totalStatusOrders) * 100);
              return (
                <div key={p.status}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[10px] font-medium capitalize text-[var(--on-surface-variant)]">{p.status}</span>
                    <span className="text-[10px] font-bold text-[var(--on-surface)]">{p.count}</span>
                  </div>
                  <div className="h-1.5 bg-[var(--surface-container-high)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Catalog spotlight + customer momentum ── */}
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">

        {/* Catalog spotlight */}
        <div className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] overflow-hidden">
          <div className="p-5 border-b border-[var(--surface-container-low)]">
            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">Catalog spotlight</p>
            <h3 className="text-base font-black mt-1 text-[var(--on-surface)]">Recent published products</h3>
          </div>
          <div className="divide-y divide-[var(--surface-container-low)]">
            {productPreview.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[var(--on-surface-variant)] text-center">No published products available.</p>
            ) : (
              productPreview.map((product, i) => (
                <div key={product.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-container-low)]/50 transition-colors">
                  <span className="text-[0.6875rem] font-black text-[var(--on-surface-variant)] w-5 text-center">{i + 1}</span>
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-[var(--surface-container-low)] flex items-center justify-center flex-shrink-0">
                    {product.thumbnail
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={product.thumbnail} alt={product.title} className="h-full w-full object-cover" />
                      : <Package size={16} className="text-[var(--on-surface-variant)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--on-surface)] truncate">{product.title}</p>
                    <p className="text-[10px] text-[var(--on-surface-variant)]">Inventory: {product.total_inventory}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Customer momentum */}
        <div className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] p-5 space-y-4">
          <div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">Customer momentum</p>
            <h3 className="text-base font-black mt-1 text-[var(--on-surface)]">Growth snapshot</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Total customers',    value: customerStats?.total_customers || 0 },
              { label: 'New this month',     value: customerStats?.new_this_month || 0 },
              { label: 'Avg order value',    value: fmtCurrency(overview?.average_order_value || 0) },
              { label: 'Total orders',       value: overview?.total_orders || 0 },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl bg-[var(--surface-container-low)] px-4 py-3">
                <span className="text-xs text-[var(--on-surface-variant)]">{row.label}</span>
                <span className="text-xs font-bold text-[var(--on-surface)]">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Weekly spark */}
          <div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)] mb-3">Weekly revenue</p>
            <div className="flex items-end gap-1 h-16">
              {weeklyTrend.length > 0
                ? weeklyTrend.map((p, i) => {
                    const val = p.sales || p.revenue || 0;
                    const maxW = Math.max(...weeklyTrend.map((x) => x.sales || x.revenue || 0), 1);
                    const pct = Math.max((val / maxW) * 100, 6);
                    return (
                      <div key={p.date} className="flex-1 rounded-t-md"
                        style={{ height: `${pct}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length], opacity: 0.8 }}
                        title={`${fmtDate(p.date)}: ${fmtCurrency(val)}`} />
                    );
                  })
                : [40, 60, 48, 75, 85, 70, 90].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-md bg-[var(--surface-container-high)]" style={{ height: `${h}%` }} />
                  ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
