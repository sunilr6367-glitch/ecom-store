'use client';


import { Heading } from '@/design-system';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';
import { api } from '@/lib/api';
import { Order } from '@/types/backend';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Package,
  CreditCard,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { OptimizedImage } from '@/design-system';
import { Textarea } from '@/design-system';
import { Select } from '@/design-system';
import { Badge } from '@/design-system';
import { Button, ButtonAnchor, ButtonLink } from '@/design-system';
import { Card } from '@/design-system';
import { EmptyState } from '@/design-system';
import { Modal } from '@/design-system';
import { StatusBanner } from '@/design-system';
import { getOrderStatusBadgeClass, getOrderStatusConfig } from '@/lib/order-status';

// Extended order interface for frontend display
interface OrderWithDetails extends Order {
  items: Array<{
    id: string;
    product_id?: string;
    variant_id?: string;
    title: string;
    thumbnail?: string | null;
    quantity: number;
    unit_price: number;
    metadata?: {
      variant?: string;
      original_variant_id?: string;
    } | null;
  }>;
  subtotal: number;
  shipping_total: number;
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    address_1: string;
    address_2?: string;
    city: string;
    postal_code: string;
    country_code?: string;
  };
  payment_intent_id?: string;
  tracking_link?: string | null;
  workflow?: Order['workflow'] & {
    packages?: Array<{
      id: string;
      sequence: number;
      ship_date?: string | null;
      carrier?: string | null;
      service?: string | null;
      tracking_number?: string | null;
      tracking_url?: string | null;
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
    }>;
    primary_package?: {
      id: string;
      sequence: number;
      ship_date?: string | null;
      carrier?: string | null;
      service?: string | null;
      tracking_number?: string | null;
      tracking_url?: string | null;
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
    } | null;
  };
}

type CustomerReturn = {
  id: string;
  order_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded' | string;
  refund_amount?: number | null;
  admin_notes?: string | null;
  created_at: string;
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

export default function OrderDetailsPage() {
  const { customer, loading } = useAuth();
  const { addItem } = useCart();
  const { currentRegion } = useShop();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  // Return Request state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});
  const [existingReturn, setExistingReturn] = useState<CustomerReturn | null>(null);

  // Handle reorder functionality
  const handleReorder = async () => {
    if (!order || !order.items || order.items.length === 0) {
      setReorderError('No items to reorder');
      return;
    }

    setReordering(true);
    setReorderError(null);

    try {
      let addedCount = 0;
      let failedCount = 0;

      // Add each item to cart
      for (const orderItem of order.items) {
        try {
          let product = null;

          // Prefer product_id for stable lookup, fall back to title search
          if (orderItem.product_id) {
            try {
              product = await api.getProduct(orderItem.product_id);
            } catch {
              // Product not found, try title search as fallback
              product = await api.searchProductsByTitle(orderItem.title);
            }
          } else {
            // Fallback: search by title
            product = await api.searchProductsByTitle(orderItem.title);
          }

          if (product) {
            // Find matching variant - prefer variant_id, then metadata.variant, then first variant
            const variant = orderItem.variant_id
              ? product.variants?.find(
                  (v: { id: string }) => v.id === orderItem.variant_id
                )
              : product.variants?.find(
                  (v: { metadata?: { variant?: string } }) =>
                    v.metadata?.variant === orderItem.metadata?.variant
                ) || product.variants?.[0];

            if (variant) {
              addItem({
                id: product.id,
                variantId: variant.id,
                quantity: orderItem.quantity,
                title: product.title,
                price:
                  variant.prices?.find(
                    (p: { currency_code: string }) =>
                      p.currency_code ===
                      (currentRegion?.currency_code || 'usd')
                  )?.amount || orderItem.unit_price,
                currency: currentRegion?.currency_code?.toUpperCase() || 'USD',
                thumbnail:
                  product.thumbnail || orderItem.thumbnail || undefined,
                sku: variant.sku,
                handle: product.handle || product.id,
              });
              addedCount++;
            } else {
              // No valid variant - skip this item
              console.warn(
                'No matching variant found for item:',
                orderItem.title
              );
              failedCount++;
            }
          } else {
            // Product not found - skip this item
            console.warn('Product not found for item:', orderItem.title);
            failedCount++;
          }
        } catch (err) {
          console.error('Failed to add item to cart:', orderItem.title, err);
          failedCount++;
        }
      }

      if (addedCount > 0) {
        // Show success message
        if (failedCount > 0) {
          alert(
            `${addedCount} items added to cart. ${failedCount} items could not be added.`
          );
        }
        router.push('/cart');
      } else {
        setReorderError('Could not add any items to cart. Please try again.');
      }
    } catch (err) {
      console.error('Reorder failed:', err);
      setReorderError('Failed to reorder items. Please try again.');
    } finally {
      setReordering(false);
    }
  };

  const handleRequestReturn = async () => {
    if (!order) return;
    const selectedItems = Object.entries(returnItems)
      .filter(([, qty]) => qty > 0)
      .map(([id, quantity]) => ({ line_item_id: id, quantity, restock: true }));

    if (selectedItems.length === 0) {
      setReturnError('Please select at least one item to return.');
      return;
    }
    if (returnReason.trim().length < 10) {
      setReturnError(
        'Please describe your reason for returning (min 10 characters).'
      );
      return;
    }

    setReturnLoading(true);
    setReturnError(null);
    try {
      const response = await api.requestReturn({
        order_id: order.id,
        reason: returnReason.trim(),
        items: selectedItems,
      });
      setExistingReturn({
        id: response.return_id,
        order_id: order.id,
        reason: returnReason.trim(),
        status: 'pending',
        refund_amount: 0,
        created_at: new Date().toISOString(),
      });
      setReturnSuccess(
        'Your return request has been submitted. Our team will review it within 2-3 business days.'
      );
      setShowReturnModal(false);
    } catch (err: unknown) {
      setReturnError(
        err instanceof Error
          ? err.message
          : 'Failed to submit return request.'
      );
    } finally {
      setReturnLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !customer) {
      router.push('/login');
    }
  }, [loading, customer, router]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!params.id) return;

      try {
        const [orderRes, returnsRes] = await Promise.all([
          api.getOrder(params.id as string),
          api.getCustomerReturns().catch(() => ({ returns: [] })),
        ]);
        setOrder(orderRes.order);
        setExistingReturn(
          (returnsRes.returns || []).find(
            (item: CustomerReturn) => item.order_id === orderRes.order.id
          ) || null
        );
        setFetching(false);
      } catch {
        setError('Failed to load order');
        setFetching(false);
      }
    };
    fetchOrder();
  }, [params.id]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <EmptyState
          icon={<Package size={44} />}
          title={error || 'Order not found'}
          actions={
        <Link href="/account" className="underline">
          Back to Account
        </Link>
          }
        />
      </div>
    );
  }

  const date = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const workflowTimeline = order.workflow?.timeline?.filter((step) =>
    ['pending', 'processing', 'shipped', 'delivered'].includes(step.key)
  ) || [
    { key: 'pending', label: 'Order placed', happened_at: null, completed: true, current: false },
    { key: 'processing', label: 'Processing', happened_at: null, completed: false, current: true },
    { key: 'shipped', label: 'Shipped', happened_at: null, completed: false, current: false },
    { key: 'delivered', label: 'Delivered', happened_at: null, completed: false, current: false },
  ];
  const workflowIndex = workflowTimeline.findIndex((step) => step.current);
  const completedWorkflowSteps = workflowTimeline.filter(
    (step) => step.completed || step.current
  ).length;
  const workflowProgressWidth = `${Math.max(
    25,
    Math.round((completedWorkflowSteps / workflowTimeline.length) * 100)
  )}%`;
  const canRequestReturn =
    order.status === 'delivered' || order.raw_status === 'completed';

  return (
    <div className="min-h-screen bg-parchment py-token-xl md:py-token-2xl lg:py-token-3xl">
      <div className="mx-auto max-w-4xl px-home-mobile md:px-home-tablet lg:px-home-desktop">
        <Link
          href="/account"
          className="account-muted mb-8 inline-flex items-center gap-2 transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        <Card className="overflow-hidden shadow-sm">
          <div className="p-6 md:p-8 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Heading role="page" className="account-detail-title mb-1">
                Order #{order.display_id}
              </Heading>
              <p className="account-muted flex items-center gap-2">
                <Clock size={14} /> Placed on {date}
              </p>
            </div>
            <Badge
              className={`account-status-badge inline-flex items-center gap-2 rounded-full border px-4 py-1.5 ${getOrderStatusBadgeClass(order.status)}`}
            >
              {order.status === 'delivered' && <CheckCircle size={14} />}
              {(order.status === 'canceled' || order.status === 'cancelled') && <XCircle size={14} />}
              {order.status === 'shipped' && <Truck size={14} />}
              {order.status === 'pending' && <Package size={14} />}
              {getOrderStatusConfig(order.status).label}
            </Badge>
          </div>

          <div className="bg-parchment p-6 border-b border-border-subtle">
            <div className="account-progress-labels flex items-center justify-between">
              {workflowTimeline.map((step, index) => (
                <span
                  key={step.key}
                  className={step.completed || step.current || index === 0 ? 'text-primary' : ''}
                >
                  {step.label}
                </span>
              ))}
            </div>
            <div className="mt-3 h-1 bg-surface-warm rounded-full relative">
              <div
                className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: workflowIndex >= 0 ? workflowProgressWidth : '25%' }}
              ></div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--ds-border-subtle)]">
            <div className="md:col-span-2 p-6 md:p-8">
              <p className="account-kicker mb-6 flex items-center gap-2">
                <Package size={16} /> Items ({(order.items || []).length})
              </p>
              <div className="space-y-6">
                {(order.items || []).map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-20 bg-surface-soft border border-border-subtle shrink-0">
                      {item.thumbnail ? (
                        <OptimizedImage
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="account-caption flex h-full items-center justify-center">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="account-name truncate">
                        {item.title}
                      </p>
                      <p className="account-caption mt-1">
                        Qty: {item.quantity} x{' '}
                        {new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: order.currency_code?.toUpperCase() || 'INR',
                        }).format(item.unit_price / 100)}
                      </p>
                      {item.metadata?.variant && (
                        <p className="account-caption mt-1 ">
                          {String(item.metadata.variant)}
                        </p>
                      )}
                    </div>
                    <p className="account-name">
                      {new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: order.currency_code?.toUpperCase() || 'INR',
                      }).format((item.unit_price * item.quantity) / 100)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-border-subtle space-y-2">
                <div className="account-muted flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {new Intl.NumberFormat(undefined, {
                      style: 'currency',
                      currency: order.currency_code?.toUpperCase() || 'INR',
                    }).format(order.subtotal / 100)}
                  </span>
                </div>
                <div className="account-muted flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {order.shipping_total
                      ? new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: order.currency_code?.toUpperCase() || 'INR',
                        }).format(order.shipping_total / 100)
                      : 'Free'}
                  </span>
                </div>
                <div className="account-total-row mt-4 flex justify-between border-t border-border-subtle pt-4">
                  <span>Total</span>
                  <span>
                    {new Intl.NumberFormat(undefined, {
                      style: 'currency',
                      currency: order.currency_code?.toUpperCase() || 'INR',
                    }).format(order.total / 100)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-parchment/50 space-y-8">
              <div>
                <p className="account-form-label mb-3 flex items-center gap-2">
                  <Package size={16} /> Shipping Address
                </p>
                <address className="account-body space-y-1 not-italic">
                  <p className="account-name">
                    {order.shipping_address?.first_name}{' '}
                    {order.shipping_address?.last_name}
                  </p>
                  <p>{order.shipping_address?.address_1}</p>
                  {order.shipping_address?.address_2 && (
                    <p>{order.shipping_address?.address_2}</p>
                  )}
                  <p>
                    {order.shipping_address?.city},{' '}
                    {order.shipping_address?.postal_code}
                  </p>
                  <p>{order.shipping_address?.country_code?.toUpperCase()}</p>
                </address>
              </div>

              <div>
                <p className="account-form-label mb-3">
                  <CreditCard size={16} className="inline mr-2" /> Payment Method
                </p>
                <div className="account-body">
                  <p className="capitalize mb-1">
                    {order.payment_status?.replace('_', ' ') || 'Unknown'}
                  </p>
                  <p className="account-mono-caption">
                    {order.payment_intent_id?.slice(-8)}...
                  </p>
                </div>
              </div>

              {(order.workflow?.estimated_delivery_start ||
                order.workflow?.estimated_delivery_end ||
                order.workflow?.customer_note) && (
                <div>
                  <p className="account-form-label mb-3">Delivery updates</p>
                  <div className="account-body space-y-2">
                    {(order.workflow?.estimated_delivery_start ||
                      order.workflow?.estimated_delivery_end) && (
                      <p>
                        ETA: {order.workflow?.estimated_delivery_start || 'TBD'}
                        {order.workflow?.estimated_delivery_end
                          ? ` - ${order.workflow.estimated_delivery_end}`
                          : ''}
                      </p>
                    )}
                    {order.workflow?.customer_note && (
                      <p>{order.workflow.customer_note}</p>
                    )}
                  </div>
                </div>
              )}

              {(order.workflow?.packages || []).length > 0 && (
                <div>
                  <p className="account-form-label mb-3">Packages</p>
                  <div className="space-y-3">
                    {(order.workflow?.packages || []).map((pkg) => (
                      <div
                        key={pkg.id}
                        className="rounded border border-border-subtle px-4 py-3 text-body-sm text-secondary"
                      >
                        <p className="account-mono-caption">
                          Package #{pkg.sequence}
                        </p>
                        <p className="mt-1">
                          {pkg.no_tracking
                            ? 'No tracking attached'
                            : pkg.tracking_number || 'Tracking pending'}
                        </p>
                        <p className="mt-1 text-muted">
                          {[pkg.carrier, pkg.service].filter(Boolean).join(' / ') ||
                            'Carrier details pending'}
                        </p>
                        {pkg.no_tracking_reason ? (
                          <p className="mt-1 text-muted">
                            Reason: {pkg.no_tracking_reason}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-border-subtle space-y-3">
                {reorderError && (
                  <StatusBanner tone="danger" className="account-alert">
                    {reorderError}
                  </StatusBanner>
                )}
                {returnSuccess && (
                  <StatusBanner tone="success" className="account-alert">
                    {returnSuccess}
                  </StatusBanner>
                )}
                {existingReturn ? (
                  <Card className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="account-form-label">Return request</p>
                      <Badge
                        className={`rounded-full border px-3 py-1 text-body-xs font-semibold tracking-token-wide ${getReturnStatusClasses(existingReturn.status)}`}
                      >
                        {existingReturn.status}
                      </Badge>
                    </div>
                    <p className="mt-3 text-body-sm text-secondary">
                      {existingReturn.reason}
                    </p>
                    <p className="mt-2 text-body-xs text-muted">
                      Submitted{' '}
                      {new Date(existingReturn.created_at).toLocaleDateString()}
                    </p>
                    {existingReturn.admin_notes ? (
                      <p className="mt-2 text-body-sm text-muted">
                        Team note: {existingReturn.admin_notes}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <ButtonLink
                        href="/help"
                        variant="outline"
                        size="sm"
                      >
                        Help Center
                      </ButtonLink>
                      <ButtonLink
                        href="/returns"
                        variant="outline"
                        size="sm"
                      >
                        View Returns Hub
                      </ButtonLink>
                      <ButtonLink
                        href={`/contact?reason=returns&order=${order.display_id}&email=${encodeURIComponent(order.email)}`}
                        variant="outline"
                        size="sm"
                      >
                        Contact Support
                      </ButtonLink>
                    </div>
                  </Card>
                ) : null}
                <Button
                  type="button"
                  onClick={handleReorder}
                  disabled={
                    reordering || !order.items || order.items.length === 0
                  }
                  variant="outline"
                  size="md"
                  fullWidth
                >
                  {reordering ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Adding to Cart...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} /> Reorder
                    </>
                  )}
                </Button>
                {canRequestReturn && !existingReturn && (
                  <Button
                    type="button"
                    onClick={() => {
                      setShowReturnModal(true);
                      setReturnError(null);
                      setReturnSuccess(null);
                      setReturnReason('');
                      setReturnItems({});
                    }}
                    variant="outline"
                    size="md"
                    fullWidth
                    className="hover:border-danger hover:bg-danger-bg hover:text-error"
                  >
                    <RotateCcw size={14} /> Request Return
                  </Button>
                )}
                {order.workflow?.primary_package?.tracking_url || order.tracking_link ? (
                  <ButtonAnchor
                    href={
                      order.workflow?.primary_package?.tracking_url ||
                      order.tracking_link ||
                      '#'
                    }
                    target="_blank"
                    rel="noreferrer"
                    variant="outline"
                    size="md"
                    fullWidth
                    leadingIcon={<Truck size={14} />}
                  >
                    Track Package
                  </ButtonAnchor>
                ) : null}
                <ButtonLink
                  href="/help"
                  variant="outline"
                  size="md"
                  fullWidth
                >
                  Help Center
                </ButtonLink>
                <ButtonLink
                  href="/payment-help"
                  variant="outline"
                  size="md"
                  fullWidth
                >
                  Payment Help
                </ButtonLink>
                <ButtonLink
                  href={`/contact?order=${order.display_id}&email=${encodeURIComponent(order.email)}`}
                  variant="outline"
                  size="md"
                  fullWidth
                >
                  Need Help?
                </ButtonLink>
              </div>
            </div>
          </div>
        </Card>
      </div>
      {/* Return Request Modal */}
      {order ? (
        <Modal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          title="Request Return"
          className="max-w-lg"
        >
            <div className="space-y-5">
              <p className="account-caption">Order #{order.display_id}</p>
              <div>
                <p className="account-form-label mb-3">
                  Select Items to Return
                </p>
                <div className="space-y-2">
                  {(order.items || []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b border-border-subtle"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="account-name truncate">
                          {item.title}
                        </p>
                        <p className="account-caption">
                          Qty ordered: {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <label className="account-caption">
                          Return qty:
                        </label>
                        <Select
                          aria-label={`Return quantity for ${item.title}`}
                          value={returnItems[item.id] || 0}
                          onChange={(e) =>
                            setReturnItems((prev) => ({
                              ...prev,
                              [item.id]: Number(e.target.value),
                            }))
                          }
                          containerClassName="w-16"
                          className="h-9 px-2"
                        >
                          {Array.from({ length: item.quantity + 1 }, (_, i) => (
                            <option key={i} value={i}>
                              {i}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Textarea
                  label="Reason for Return"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows={3}
                  placeholder="Please describe why you are returning this item(s)..."
                />
              </div>
              {returnError && (
                <StatusBanner tone="danger" className="account-alert">
                  {returnError}
                </StatusBanner>
              )}
            </div>
            <div className="mt-6 flex gap-3 border-t border-border-subtle pt-5">
              <Button
                type="button"
                onClick={() => setShowReturnModal(false)}
                variant="outline"
                size="md"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleRequestReturn}
                disabled={returnLoading}
                variant="secondary"
                size="md"
                className="flex-1"
              >
                {returnLoading ? 'Submitting...' : 'Submit Return'}
              </Button>
            </div>
        </Modal>
      ) : null}
    </div>
  );
}
