'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Mail,
  MapPin,
  Package,
  RefreshCw,
  Save,
  Truck,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useNotification } from '@/context/notification-context';
import {
  ActionButton,
  PageHeader,
  SectionHeader,
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
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

interface OrderPackage {
  id: string;
  sequence?: number;
  ship_date?: string | null;
  delivered_at?: string | null;
  carrier?: string | null;
  service?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  no_tracking?: boolean;
  no_tracking_reason?: string | null;
}

interface OrderDetails {
  id: string;
  order_number?: string;
  display_id?: string;
  status: string;
  raw_status?: string;
  created_at?: string;
  email?: string | null;
  customer_first_name?: string | null;
  customer_last_name?: string | null;
  customer_phone?: string | null;
  subtotal?: number;
  shipping_total?: number;
  total?: number;
  currency_code?: string;
  tracking_number?: string | null;
  shipping_carrier?: string | null;
  tracking_link?: string | null;
  shipping_address?: {
    first_name?: string | null;
    last_name?: string | null;
    address_1?: string | null;
    address_2?: string | null;
    city?: string | null;
    postal_code?: string | null;
    province?: string | null;
    country_code?: string | null;
  } | null;
  workflow?: {
    ship_by_date?: string | null;
    estimated_delivery_start?: string | null;
    estimated_delivery_end?: string | null;
    customer_note?: string | null;
    internal_note?: string | null;
    primary_package?: OrderPackage | null;
    packages?: OrderPackage[];
    timeline?: Array<{
      key: string;
      label: string;
      completed: boolean;
      current: boolean;
    }>;
  };
  packages?: OrderPackage[];
}

interface OrderItem {
  id: string;
  product_thumbnail?: string | null;
  product_title?: string | null;
  title?: string | null;
  variant_title?: string | null;
  total?: number;
  unit_price?: number;
  quantity?: number;
}

interface TrackingFormState {
  ship_date: string;
  shipping_carrier: string;
  shipping_service: string;
  tracking_number: string;
  tracking_link: string;
  no_tracking: boolean;
  no_tracking_reason: string;
  customer_note: string;
  internal_note: string;
  notify_buyer: boolean;
}

const emptyTrackingForm: TrackingFormState = {
  ship_date: '',
  shipping_carrier: '',
  shipping_service: '',
  tracking_number: '',
  tracking_link: '',
  no_tracking: false,
  no_tracking_reason: '',
  customer_note: '',
  internal_note: '',
  notify_buyer: true,
};

function normalizeStatus(status?: string | null): WorkflowStatus {
  let normalized = status?.toLowerCase() || 'pending';
  if (normalized === 'canceled' || normalized === 'failed') {
    normalized = 'cancelled';
  } else if (normalized === 'completed') {
    normalized = 'processing';
  }
  return Object.prototype.hasOwnProperty.call(STATUS_LABELS, normalized)
    ? (normalized as WorkflowStatus)
    : 'pending';
}

function getStatusOptions(status?: string | null) {
  const current = normalizeStatus(status);
  return [current, ...VALID_TRANSITIONS[current]];
}

function normalizeOptionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount = 0, currency = 'USD') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

function getOrderNumber(order?: OrderDetails | null) {
  return order?.display_id || order?.order_number || order?.id || 'Order';
}

function getCustomerName(order?: OrderDetails | null) {
  const name = [order?.customer_first_name, order?.customer_last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  return name || 'Guest customer';
}

function getWorkflowPackages(order?: OrderDetails | null) {
  return order?.workflow?.packages || order?.packages || [];
}

function getPrimaryPackage(order?: OrderDetails | null) {
  return (
    order?.workflow?.primary_package ||
    getWorkflowPackages(order)[0] ||
    null
  );
}

function buildTrackingForm(order?: OrderDetails | null): TrackingFormState {
  const primaryPackage = getPrimaryPackage(order);
  return {
    ship_date: primaryPackage?.ship_date?.slice(0, 10) || '',
    shipping_carrier:
      primaryPackage?.carrier || order?.shipping_carrier || '',
    shipping_service: primaryPackage?.service || '',
    tracking_number:
      primaryPackage?.tracking_number || order?.tracking_number || '',
    tracking_link:
      primaryPackage?.tracking_url || order?.tracking_link || '',
    no_tracking: primaryPackage?.no_tracking === true,
    no_tracking_reason: primaryPackage?.no_tracking_reason || '',
    customer_note: order?.workflow?.customer_note || '',
    internal_note: order?.workflow?.internal_note || '',
    notify_buyer: true,
  };
}

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { showNotification } = useNotification();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingForm, setTrackingForm] =
    useState<TrackingFormState>(emptyTrackingForm);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getOrder(id);
      const orderData = data?.order || data;
      setOrder(orderData);
      setItems(data?.items || orderData?.items || []);
      setTrackingForm(buildTrackingForm(orderData));
    } catch (error) {
      console.error('Failed to load order:', error);
      showNotification('error', 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id, showNotification]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const workflowTimeline = useMemo(() => {
    const fromApi = order?.workflow?.timeline?.filter((step) =>
      ['pending', 'processing', 'shipped', 'delivered'].includes(step.key)
    );
    if (fromApi?.length) return fromApi;

    const current = normalizeStatus(order?.status);
    return (['pending', 'processing', 'shipped', 'delivered'] as WorkflowStatus[]).map(
      (step) => ({
        key: step,
        label: STATUS_LABELS[step],
        completed:
          ['pending', 'processing', 'shipped', 'delivered'].indexOf(step) <=
          ['pending', 'processing', 'shipped', 'delivered'].indexOf(current),
        current: step === current,
      })
    );
  }, [order]);

  const packages = getWorkflowPackages(order);
  const primaryPackage = getPrimaryPackage(order);
  const currency = order?.currency_code || 'USD';

  const handleStatusChange = async (status: string) => {
    if (!order) return;
    try {
      setUpdating(true);
      await api.updateOrderStatus(id, status);
      const refreshed = await api.getOrder(id);
      const refreshedOrder = refreshed?.order || refreshed;
      setOrder(refreshedOrder);
      setItems(refreshed?.items || refreshedOrder?.items || []);
      setTrackingForm(buildTrackingForm(refreshedOrder));
      showNotification('success', 'Order status updated');
    } catch (error) {
      console.error('Failed to update order status:', error);
      showNotification('error', 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleInvoiceDownload = async () => {
    try {
      const blob = await api.downloadInvoice(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${getOrderNumber(order)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Invoice download failed:', error);
      showNotification('error', 'Failed to download invoice');
    }
  };

  const handleCompleteOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trackingForm.no_tracking && !trackingForm.tracking_number.trim()) {
      showNotification(
        'error',
        'Tracking number is required unless no tracking is selected'
      );
      return;
    }

    try {
      setUpdating(true);
      await api.completeOrder(id, {
        ship_date: normalizeOptionalValue(trackingForm.ship_date),
        shipping_carrier:
          normalizeOptionalValue(trackingForm.shipping_carrier) || undefined,
        shipping_service:
          normalizeOptionalValue(trackingForm.shipping_service) || undefined,
        tracking_number: trackingForm.no_tracking
          ? null
          : trackingForm.tracking_number.trim(),
        tracking_link: trackingForm.no_tracking
          ? null
          : normalizeOptionalValue(trackingForm.tracking_link) || undefined,
        no_tracking: trackingForm.no_tracking,
        no_tracking_reason: trackingForm.no_tracking
          ? normalizeOptionalValue(trackingForm.no_tracking_reason)
          : null,
        customer_note: normalizeOptionalValue(trackingForm.customer_note),
        internal_note: normalizeOptionalValue(trackingForm.internal_note),
        notify_buyer: trackingForm.notify_buyer,
      });

      const refreshed = await api.getOrder(id);
      const refreshedOrder = refreshed?.order || refreshed;
      setOrder(refreshedOrder);
      setItems(refreshed?.items || refreshedOrder?.items || []);
      setTrackingForm(buildTrackingForm(refreshedOrder));
      showNotification('success', 'Order fulfillment updated');
    } catch (error) {
      console.error('Failed to complete order:', error);
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to update fulfillment'
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 px-4 py-6 md:px-8">
        <div className="h-10 w-44 animate-pulse rounded-2xl bg-[var(--kv-soft)]" />
        <div className="h-72 animate-pulse rounded-[1.35rem] bg-[var(--kv-soft)]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6 px-4 py-6 md:px-8">
        <ActionButton href="/dashboard/orders" icon={ArrowLeft} variant="secondary">
          Back to orders
        </ActionButton>
        <Surface className="p-8 text-center text-[var(--kv-muted)]">
          Order not found.
        </Surface>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="Order detail"
        title={`Order ${getOrderNumber(order)}`}
        description={`Placed ${formatDateTime(order.created_at)} by ${getCustomerName(order)}.`}
        actions={
          <>
            <ActionButton href="/dashboard/orders" icon={ArrowLeft} variant="secondary">
              Back
            </ActionButton>
            <ActionButton
              onClick={() => void loadOrder()}
              icon={RefreshCw}
              variant="secondary"
            >
              Refresh
            </ActionButton>
            <ActionButton
              onClick={() => void handleInvoiceDownload()}
              icon={Download}
              variant="secondary"
            >
              Invoice
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-6 px-4 md:px-8 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Surface className="p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <SectionHeader
                  title="Order status"
                  description="Move the order through the core fulfillment workflow."
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StatusBadge status={order.status} className="text-sm" />
                </div>
              </div>

              <label className="min-w-[220px] text-sm text-[var(--kv-text)]">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Change status
                </span>
                <select
                  value={normalizeStatus(order.status)}
                  onChange={(event) => void handleStatusChange(event.target.value)}
                  disabled={updating}
                  className="w-full rounded-2xl border border-[var(--kv-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--kv-accent)]"
                >
                  {getStatusOptions(order.status).map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-3">
              {workflowTimeline.map((step, index) => (
                <div key={step.key} className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      step.completed
                        ? 'bg-[var(--kv-accent)] text-white'
                        : step.current
                          ? 'bg-[var(--kv-accent-soft)] text-[var(--kv-accent-deep)]'
                          : 'bg-[var(--kv-soft)] text-[var(--kv-muted)]'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="hidden text-xs font-medium text-[var(--kv-text)] sm:inline">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="overflow-hidden">
            <div className="border-b border-[var(--kv-border)] px-5 py-4 md:px-6">
              <SectionHeader
                title="Items"
                description="Products, quantities, and line totals."
              />
            </div>
            {items.length === 0 ? (
              <div className="p-6 text-sm text-[var(--kv-muted)]">
                No line items available.
              </div>
            ) : (
              <div className="divide-y divide-[var(--kv-border)]">
                {items.map((item) => {
                  const title = item.product_title || item.title || 'Product';
                  const quantity = item.quantity || 0;
                  const unitPrice = item.unit_price || 0;
                  const total = item.total ?? unitPrice * quantity;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[var(--kv-soft)]">
                          {item.product_thumbnail ? (
                            <img
                              src={item.product_thumbnail}
                              alt={title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package size={22} className="text-[var(--kv-muted)]" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--kv-text)]">{title}</p>
                          {item.variant_title ? (
                            <p className="mt-1 text-sm text-[var(--kv-muted)]">
                              {item.variant_title}
                            </p>
                          ) : null}
                          <p className="mt-1 text-sm text-[var(--kv-muted)]">
                            Qty {quantity} x {formatCurrency(unitPrice, currency)}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-[var(--kv-text)]">
                        {formatCurrency(total, currency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-3 border-t border-[var(--kv-border)] px-5 py-5 text-sm md:px-6">
              <div className="flex items-center justify-between">
                <span className="text-[var(--kv-muted)]">Subtotal</span>
                <span>{formatCurrency(order.subtotal || 0, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--kv-muted)]">Shipping</span>
                <span>{formatCurrency(order.shipping_total || 0, currency)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--kv-border)] pt-3 text-base font-semibold text-[var(--kv-text)]">
                <span>Total</span>
                <span>{formatCurrency(order.total || 0, currency)}</span>
              </div>
            </div>
          </Surface>

          <Surface className="p-5 md:p-6">
            <SectionHeader
              title="Fulfillment"
              description="Save tracking or mark the shipment as shipped without tracking."
            />

            <form onSubmit={handleCompleteOrder} className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Ship date
                  </span>
                  <input
                    type="date"
                    value={trackingForm.ship_date}
                    onChange={(event) =>
                      setTrackingForm((current) => ({
                        ...current,
                        ship_date: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--kv-border)] px-4 py-3 outline-none focus:border-[var(--kv-accent)]"
                  />
                </label>

                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Carrier
                  </span>
                  <input
                    type="text"
                    value={trackingForm.shipping_carrier}
                    onChange={(event) =>
                      setTrackingForm((current) => ({
                        ...current,
                        shipping_carrier: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--kv-border)] px-4 py-3 outline-none focus:border-[var(--kv-accent)]"
                    placeholder="BlueDart, Delhivery, DHL"
                  />
                </label>

                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Service
                  </span>
                  <input
                    type="text"
                    value={trackingForm.shipping_service}
                    onChange={(event) =>
                      setTrackingForm((current) => ({
                        ...current,
                        shipping_service: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--kv-border)] px-4 py-3 outline-none focus:border-[var(--kv-accent)]"
                    placeholder="Express, Standard"
                  />
                </label>

                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Tracking number
                  </span>
                  <input
                    type="text"
                    value={trackingForm.tracking_number}
                    disabled={trackingForm.no_tracking}
                    onChange={(event) =>
                      setTrackingForm((current) => ({
                        ...current,
                        tracking_number: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--kv-border)] px-4 py-3 outline-none focus:border-[var(--kv-accent)] disabled:bg-[var(--kv-soft)]"
                    placeholder="Tracking number"
                  />
                </label>
              </div>

              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Tracking URL
                </span>
                <input
                  type="url"
                  value={trackingForm.tracking_link}
                  disabled={trackingForm.no_tracking}
                  onChange={(event) =>
                    setTrackingForm((current) => ({
                      ...current,
                      tracking_link: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--kv-border)] px-4 py-3 outline-none focus:border-[var(--kv-accent)] disabled:bg-[var(--kv-soft)]"
                  placeholder="https://..."
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl bg-[var(--kv-soft)] px-4 py-3 text-sm text-[var(--kv-text)]">
                <input
                  type="checkbox"
                  checked={trackingForm.no_tracking}
                  onChange={(event) =>
                    setTrackingForm((current) => ({
                      ...current,
                      no_tracking: event.target.checked,
                    }))
                  }
                />
                This shipment does not have tracking
              </label>

              {trackingForm.no_tracking ? (
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    No-tracking reason
                  </span>
                  <input
                    type="text"
                    value={trackingForm.no_tracking_reason}
                    onChange={(event) =>
                      setTrackingForm((current) => ({
                        ...current,
                        no_tracking_reason: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--kv-border)] px-4 py-3 outline-none focus:border-[var(--kv-accent)]"
                    placeholder="Hand delivery, local pickup, etc."
                  />
                </label>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Buyer note
                  </span>
                  <textarea
                    rows={4}
                    value={trackingForm.customer_note}
                    onChange={(event) =>
                      setTrackingForm((current) => ({
                        ...current,
                        customer_note: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--kv-border)] px-4 py-3 outline-none focus:border-[var(--kv-accent)]"
                    placeholder="Optional note for buyer tracking."
                  />
                </label>

                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Internal note
                  </span>
                  <textarea
                    rows={4}
                    value={trackingForm.internal_note}
                    onChange={(event) =>
                      setTrackingForm((current) => ({
                        ...current,
                        internal_note: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--kv-border)] px-4 py-3 outline-none focus:border-[var(--kv-accent)]"
                    placeholder="Private operations note."
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 text-sm text-[var(--kv-text)]">
                <input
                  type="checkbox"
                  checked={trackingForm.notify_buyer}
                  onChange={(event) =>
                    setTrackingForm((current) => ({
                      ...current,
                      notify_buyer: event.target.checked,
                    }))
                  }
                />
                Notify buyer about this shipment update
              </label>

              <button
                type="submit"
                disabled={updating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--kv-text)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 md:w-auto"
              >
                <Save size={16} />
                {updating ? 'Saving...' : 'Save fulfillment'}
              </button>
            </form>
          </Surface>
        </div>

        <aside className="space-y-6">
          <Surface className="p-5 md:p-6">
            <SectionHeader title="Customer" />
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <User size={18} className="mt-0.5 text-[var(--kv-muted)]" />
                <div>
                  <p className="font-semibold text-[var(--kv-text)]">
                    {getCustomerName(order)}
                  </p>
                  <p className="text-[var(--kv-muted)]">
                    {order.customer_phone || 'No phone provided'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 text-[var(--kv-muted)]" />
                <div>
                  {order.email ? (
                    <a
                      href={`mailto:${order.email}`}
                      className="font-medium text-[var(--kv-text)] hover:underline"
                    >
                      {order.email}
                    </a>
                  ) : (
                    <p className="text-[var(--kv-muted)]">No email provided</p>
                  )}
                </div>
              </div>
            </div>
          </Surface>

          <Surface className="p-5 md:p-6">
            <SectionHeader title="Shipping address" />
            {order.shipping_address ? (
              <div className="mt-5 flex items-start gap-3 text-sm text-[var(--kv-text)]">
                <MapPin size={18} className="mt-0.5 text-[var(--kv-muted)]" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    {order.shipping_address.first_name}{' '}
                    {order.shipping_address.last_name}
                  </p>
                  <p>{order.shipping_address.address_1}</p>
                  {order.shipping_address.address_2 ? (
                    <p>{order.shipping_address.address_2}</p>
                  ) : null}
                  <p>
                    {order.shipping_address.city},{' '}
                    {order.shipping_address.postal_code}
                  </p>
                  <p>
                    {order.shipping_address.province ||
                      order.shipping_address.country_code ||
                      'Country not set'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--kv-muted)]">
                No shipping address available.
              </p>
            )}
          </Surface>

          <Surface className="p-5 md:p-6">
            <SectionHeader title="Tracking" />
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Truck size={18} className="mt-0.5 text-[var(--kv-muted)]" />
                <div>
                  <p className="font-semibold text-[var(--kv-text)]">
                    {primaryPackage?.carrier ||
                      order.shipping_carrier ||
                      'Carrier not set'}
                  </p>
                  <p className="text-[var(--kv-muted)]">
                    {primaryPackage?.tracking_number ||
                      order.tracking_number ||
                      'Tracking pending'}
                  </p>
                </div>
              </div>
              {(primaryPackage?.tracking_url || order.tracking_link) ? (
                <Link
                  href={primaryPackage?.tracking_url || order.tracking_link || '#'}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--kv-accent-deep)]"
                >
                  Open tracking
                  <ExternalLink size={14} />
                </Link>
              ) : null}
              <div className="rounded-2xl bg-[var(--kv-soft)] p-4 text-xs text-[var(--kv-muted)]">
                <p>Ship by: {formatDate(order.workflow?.ship_by_date)}</p>
                <p>
                  ETA: {formatDate(order.workflow?.estimated_delivery_start)} -{' '}
                  {formatDate(order.workflow?.estimated_delivery_end)}
                </p>
              </div>
            </div>
          </Surface>

          <Surface className="p-5 md:p-6">
            <SectionHeader title="Packages" />
            {packages.length > 0 ? (
              <div className="mt-5 space-y-3">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="rounded-2xl border border-[var(--kv-border)] px-4 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-[var(--kv-text)]">
                        Package #{pkg.sequence || 1}
                      </p>
                      <StatusBadge
                        status={pkg.delivered_at ? 'delivered' : pkg.tracking_number ? 'shipped' : 'pending'}
                      />
                    </div>
                    <p className="mt-2 text-[var(--kv-muted)]">
                      {[pkg.carrier, pkg.service].filter(Boolean).join(' - ') ||
                        'Carrier not set'}
                    </p>
                    <p className="text-[var(--kv-muted)]">
                      {pkg.no_tracking
                        ? pkg.no_tracking_reason || 'No tracking'
                        : pkg.tracking_number || 'Tracking pending'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--kv-muted)]">
                No package records yet.
              </p>
            )}
          </Surface>
        </aside>
      </div>
    </div>
  );
}
