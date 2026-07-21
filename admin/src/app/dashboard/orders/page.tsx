'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  PackageCheck,
  PackagePlus,
  RefreshCw,
  Search,
  Truck,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  ActionButton,
  MetricCard,
  StatusBadge,
  Surface,
} from '@/components/ui/admin-ui';

type WorkflowStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
type OrderFilter = 'all' | WorkflowStatus;

interface Order {
  id: string;
  order_number: string;
  status: string;
  email: string;
  total: number;
  currency_code: string;
  customer_id: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  created_at: string;
  shipping_first_name?: string | null;
  shipping_last_name?: string | null;
  shipping_city?: string | null;
  shipping_postal_code?: string | null;
  shipping_country_code?: string | null;
  workflow?: {
    status?: WorkflowStatus;
    status_label?: string;
    ship_by_date?: string | null;
    has_tracking?: boolean;
    needs_attention?: boolean;
    overdue_ship_by?: boolean;
    overdue_tracking?: boolean;
    label?: {
      url?: string | null;
    };
    primary_package?: {
      id: string;
      sequence: number;
      ship_date?: string | null;
      delivered_at?: string | null;
      carrier?: string | null;
      service?: string | null;
      tracking_number?: string | null;
      tracking_url?: string | null;
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
      label_url?: string | null;
      label_state?: string | null;
    } | null;
    packages?: Array<{
      id: string;
      sequence: number;
      ship_date?: string | null;
      delivered_at?: string | null;
      carrier?: string | null;
      service?: string | null;
      tracking_number?: string | null;
      tracking_url?: string | null;
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
      label_url?: string | null;
      label_state?: string | null;
    }>;
  };
}

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  refunded_orders?: number;
  avg_order_value: number;
}

const FILTERS: Array<{ label: string; value: OrderFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
];

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const VALID_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'cancelled', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

function normalizeStatus(status: string): WorkflowStatus {
  const normalized =
    status.toLowerCase() === 'canceled' ? 'cancelled' : status.toLowerCase();
  return Object.prototype.hasOwnProperty.call(STATUS_LABELS, normalized)
    ? (normalized as WorkflowStatus)
    : 'pending';
}

function getStatusOptions(status: string) {
  const current = normalizeStatus(status);
  return [current, ...VALID_TRANSITIONS[current]];
}

function fmtCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getWorkflowStatus(order: Order): WorkflowStatus {
  return normalizeStatus(order.workflow?.status || order.status);
}

function getDestinationLabel(order: Order) {
  const name = [order.shipping_first_name, order.shipping_last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  const location = [
    order.shipping_city,
    order.shipping_postal_code,
    order.shipping_country_code,
  ]
    .filter(Boolean)
    .join(', ')
    .trim();

  return {
    name: name || 'Destination pending',
    location: location || 'Address not filled yet',
  };
}

function getPrimaryPackage(order: Order) {
  return order.workflow?.primary_package || order.workflow?.packages?.[0] || null;
}

function canCompleteOrder(order: Order) {
  const workflowStatus = getWorkflowStatus(order);
  return workflowStatus === 'pending' || workflowStatus === 'processing';
}

function getTrackingHeadline(order: Order) {
  const primaryPackage = getPrimaryPackage(order);

  if (primaryPackage?.no_tracking) {
    return {
      title: 'No tracking required',
      detail:
        primaryPackage.no_tracking_reason ||
        'This shipment is intentionally marked without tracking.',
      tone: 'border-[#f0d7a1] bg-[#fff8ea]',
    };
  }

  if (primaryPackage?.tracking_number) {
    return {
      title: primaryPackage.tracking_number,
      detail: primaryPackage.tracking_url
        ? 'Tracking link added'
        : 'Tracking link still needs to be added',
      tone: 'border-[var(--kv-accent)]/20 bg-[var(--kv-accent-soft)]',
    };
  }

  return {
    title: 'Tracking not filled',
    detail: 'Add tracking link or mark this shipment as no-tracking.',
    tone: 'border-[var(--kv-danger)]/15 bg-[#fdf1ef]',
  };
}

function parseOrderFilterParam(value: string | null): OrderFilter {
  return FILTERS.some((filter) => filter.value === value)
    ? (value as OrderFilter)
    : 'all';
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<OrderFilter>(() =>
    parseOrderFilterParam(searchParams.get('status'))
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getOrders(
        20,
        (page - 1) * 20,
        search,
        statusFilter
      );
      setOrders(data?.orders || data || []);
      setTotalPages(data?.pagination?.total_pages || 1);
    } catch {
      setOrders([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchStats = async () => {
    try {
      const orderStats = await api.getOrderStats();
      setStats(orderStats || null);
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
      setStats(null);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    void fetchStats();
  }, []);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setStatusFilter(parseOrderFilterParam(searchParams.get('status')));
    setPage(1);
  }, [searchParams]);

  const getName = (order: Order) => {
    const fullName = [order.customer_first_name, order.customer_last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    return fullName || 'Guest customer';
  };

  const singleUpdate = async (id: string, nextStatus: string) => {
    await api.updateOrderStatus(id, nextStatus);
    await Promise.all([fetchOrders(), fetchStats()]);
  };

  const resetQueueView = () => {
    router.replace('/dashboard/orders');
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  const statCount = (value: OrderFilter) =>
    (
      {
        all: stats?.total_orders,
        pending: stats?.pending_orders,
        processing: stats?.processing_orders,
        shipped: stats?.shipped_orders,
        delivered: stats?.delivered_orders,
        cancelled: stats?.cancelled_orders,
        refunded: stats?.refunded_orders,
      } as Record<OrderFilter, number | undefined>
    )[value] || 0;

  const totalOrders = stats?.total_orders || 0;
  const hasActiveFilters = search.length > 0 || statusFilter !== 'all';

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--kv-accent-deep)]">
            Orders
          </p>
          <h2 className="mt-2 text-[2.6rem] font-[var(--font-display)] leading-none text-[var(--kv-text)]">
            Orders &amp; Shipping
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--kv-muted)]">
            Review orders, update status, and jump into shipping actions without
            extra queue management screens.
          </p>
        </div>
        <ActionButton
          onClick={() => void Promise.all([fetchOrders(), fetchStats()])}
          icon={RefreshCw}
          variant="secondary"
        >
          Refresh
        </ActionButton>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Total Orders"
          value={stats?.total_orders || 0}
          icon={PackageCheck}
          hint="All retail orders"
          tone="accent"
        />
        <MetricCard
          label="Pending"
          value={stats?.pending_orders || 0}
          icon={Clock3}
          hint="Awaiting action"
          tone="warning"
        />
        <MetricCard
          label="In Progress"
          value={stats?.processing_orders || 0}
          icon={Truck}
          hint="Being prepared"
        />
        <MetricCard
          label="Revenue"
          value={fmtCurrency(stats?.total_revenue || 0)}
          icon={Clock3}
          hint={`Avg ${fmtCurrency(stats?.avg_order_value || 0)}`}
        />
      </div>

      <Surface className="p-5 md:p-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--kv-muted)]"
            />
            <input
              type="search"
              placeholder="Search order #, buyer, email, address, item title, or notes"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-soft)] py-3 pl-10 pr-4 text-sm text-[var(--kv-text)] placeholder:text-[var(--kv-muted)] focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as OrderFilter);
              setPage(1);
            }}
            className="min-w-[190px] rounded-2xl border border-[var(--kv-border)] bg-white px-4 py-3 text-sm text-[var(--kv-text)] focus:outline-none"
          >
            {FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
                {statCount(filter.value) > 0 ? ` (${statCount(filter.value)})` : ''}
              </option>
            ))}
          </select>
        </div>
      </Surface>

      <div className="space-y-4">
        {loading ? (
          <Surface className="px-6 py-14 text-center text-sm text-[var(--kv-muted)]">
            Loading orders...
          </Surface>
        ) : orders.length === 0 ? (
          <Surface className="px-6 py-14">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                Orders &amp; Shipping
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-[var(--kv-text)]">
                {totalOrders === 0
                  ? 'No orders have been placed yet'
                  : 'No orders match this view right now'}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--kv-muted)]">
                {totalOrders === 0
                  ? 'Order status, tracking, package, and label actions appear as soon as the first order is placed.'
                  : 'Try clearing the search or status filter. Shipping actions live on each order row and detail page.'}
              </p>
              {hasActiveFilters ? (
                <div className="mt-6">
                  <ActionButton onClick={resetQueueView} icon={RefreshCw} variant="secondary">
                    Reset view
                  </ActionButton>
                </div>
              ) : null}
            </div>
          </Surface>
        ) : (
          orders.map((order) => {
            const workflowStatus = getWorkflowStatus(order);
            const destination = getDestinationLabel(order);
            const primaryPackage = getPrimaryPackage(order);
            const packageCount = order.workflow?.packages?.length || (primaryPackage ? 1 : 0);
            const trackingSummary = getTrackingHeadline(order);
            const hasLabel = Boolean(
              primaryPackage?.label_url || order.workflow?.label?.url
            );

            return (
              <Surface key={order.id} className="overflow-hidden">
                <div className="border-b border-[var(--kv-border)] px-5 py-4 md:px-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="text-lg font-semibold text-[var(--kv-text)] hover:text-[var(--kv-accent-deep)]"
                        >
                          Order #{order.order_number}
                        </Link>
                        <StatusBadge status={workflowStatus} className="text-[11px]" />
                        {order.workflow?.overdue_ship_by ? (
                          <span className="inline-flex items-center rounded-full bg-[#faebe9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-danger)]">
                            Ship-by overdue
                          </span>
                        ) : null}
                        {hasLabel ? (
                          <span className="inline-flex items-center rounded-full bg-[var(--kv-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-muted)]">
                            Label ready
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-[var(--kv-muted)]">
                        Placed {fmtDate(order.created_at)}. Open the order, complete the shipment, or add tracking from here.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canCompleteOrder(order) ? (
                        <ActionButton
                          onClick={() => router.push(`/dashboard/orders/${order.id}?action=complete`)}
                          icon={PackageCheck}
                        >
                          Complete order
                        </ActionButton>
                      ) : null}
                      <ActionButton
                        onClick={() => router.push(`/dashboard/orders/${order.id}?action=edit-tracking`)}
                        icon={Truck}
                        variant="secondary"
                      >
                        Tracking / no tracking
                      </ActionButton>
                      <ActionButton
                        onClick={() => router.push(`/dashboard/orders/${order.id}?action=add-package`)}
                        icon={PackagePlus}
                        variant="secondary"
                      >
                        Add package
                      </ActionButton>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 px-5 py-5 md:px-6 xl:grid-cols-[1fr_1fr_1.15fr_1.05fr]">
                  <div className="border border-[var(--kv-border)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                      Buyer
                    </p>
                    <div className="mt-3 flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--kv-soft)] text-[var(--kv-accent-deep)]">
                        <User size={18} />
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--kv-text)]">{getName(order)}</p>
                        <p className="mt-1 text-sm text-[var(--kv-muted)]">{order.email}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--kv-muted)]">
                          Order value
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--kv-text)]">
                          {fmtCurrency(order.total, order.currency_code || 'INR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-[var(--kv-border)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                      Destination
                    </p>
                    <div className="mt-3 flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--kv-soft)] text-[var(--kv-accent-deep)]">
                        <MapPin size={18} />
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--kv-text)]">{destination.name}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--kv-muted)]">
                          {destination.location}
                        </p>
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--kv-muted)]">
                          Ship by
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--kv-text)]">
                          {order.workflow?.ship_by_date
                            ? fmtDate(order.workflow.ship_by_date)
                            : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`border px-4 py-4 ${trackingSummary.tone}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                      Primary shipment
                    </p>
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[var(--kv-text)]">
                          {trackingSummary.title}
                        </p>
                        <p className="mt-1 text-sm text-[var(--kv-muted)]">
                          {trackingSummary.detail}
                        </p>
                        <div className="mt-3 space-y-1 text-sm text-[var(--kv-muted)]">
                          <p>
                            Package count:{' '}
                            <span className="font-medium text-[var(--kv-text)]">
                              {packageCount}
                            </span>
                          </p>
                          <p>
                            Carrier:{' '}
                            <span className="font-medium text-[var(--kv-text)]">
                              {[primaryPackage?.carrier, primaryPackage?.service]
                                .filter(Boolean)
                                .join(' / ') || 'Not filled yet'}
                            </span>
                          </p>
                          <p>
                            Label state:{' '}
                            <span className="font-medium text-[var(--kv-text)]">
                              {primaryPackage?.label_state || 'draft'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--kv-accent-deep)]">
                        <Truck size={18} />
                      </span>
                    </div>
                  </div>

                  <div className="border border-[var(--kv-border)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                      Shipping actions
                    </p>
                    <div className="mt-3 space-y-2">
                      {primaryPackage?.tracking_url ? (
                        <a
                          href={primaryPackage.tracking_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between border border-[var(--kv-border)] px-3 py-3 text-sm font-medium text-[var(--kv-text)] hover:bg-[var(--kv-soft)]"
                        >
                          <span>Open tracking link</span>
                          <ExternalLink size={16} />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/orders/${order.id}?action=edit-tracking`)}
                          className="flex w-full items-center justify-between border border-dashed border-[var(--kv-border)] px-3 py-3 text-sm font-medium text-[var(--kv-text)] hover:bg-[var(--kv-soft)]"
                        >
                          <span>Add tracking link</span>
                          <Truck size={16} />
                        </button>
                      )}

                      {hasLabel ? (
                        <a
                          href={primaryPackage?.label_url || order.workflow?.label?.url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between border border-[var(--kv-border)] px-3 py-3 text-sm font-medium text-[var(--kv-text)] hover:bg-[var(--kv-soft)]"
                        >
                          <span>Open shipping label</span>
                          <ExternalLink size={16} />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/orders/${order.id}?action=add-package`)}
                          className="flex w-full items-center justify-between border border-dashed border-[var(--kv-border)] px-3 py-3 text-sm font-medium text-[var(--kv-text)] hover:bg-[var(--kv-soft)]"
                        >
                          <span>Create label or package</span>
                          <PackagePlus size={16} />
                        </button>
                      )}

                      <select
                        value={workflowStatus}
                        onChange={(event) => void singleUpdate(order.id, event.target.value)}
                        className="w-full border border-[var(--kv-border)] bg-white px-3 py-3 text-sm text-[var(--kv-text)] focus:outline-none"
                      >
                        {getStatusOptions(workflowStatus).map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[var(--kv-border)] bg-[var(--kv-soft)] px-5 py-4 md:px-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--kv-muted)]">
                      <span>{order.workflow?.needs_attention ? 'Needs review' : 'Ready to work'}</span>
                      <span>/</span>
                      <span>
                        {primaryPackage?.tracking_url
                          ? 'Tracking link saved'
                          : primaryPackage?.no_tracking
                            ? 'No-tracking saved'
                            : 'Tracking link missing'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ActionButton
                        href={`/dashboard/orders/${order.id}?action=message-buyer`}
                        icon={Mail}
                        variant="secondary"
                      >
                        Message buyer
                      </ActionButton>
                      <ActionButton href={`/dashboard/orders/${order.id}`} icon={ExternalLink}>
                        Open order
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </Surface>
            );
          })
        )}

        {totalPages > 1 ? (
          <Surface className="px-5 py-4 md:px-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-2xl border border-[var(--kv-border)] px-4 py-2 text-sm font-semibold text-[var(--kv-text)] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-[var(--kv-muted)]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="rounded-2xl border border-[var(--kv-border)] px-4 py-2 text-sm font-semibold text-[var(--kv-text)] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </Surface>
        ) : null}
      </div>
    </div>
  );
}
