'use client';


import { Heading } from '@/design-system';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { OrderWithDetails } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { OrdersListSkeleton } from '@/design-system';
import { Badge } from '@/design-system';
import { Card } from '@/design-system';
import { EmptyState } from '@/design-system';
import { getOrderStatusBadgeClass, getOrderStatusConfig } from '@/lib/order-status';
import { Button, ButtonLink, IconButton } from '@/design-system';

const ORDERS_PER_PAGE = 10;

type CustomerReturn = {
  id: string;
  order_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded' | string;
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

export default function OrdersListPage() {
  const { customer, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [returnsByOrderId, setReturnsByOrderId] = useState<
    Record<string, CustomerReturn>
  >({});

  useEffect(() => {
    if (!loading && !customer) {
      router.push('/login');
    }
  }, [loading, customer, router]);

  useEffect(() => {
    if (loading || !customer) {
      return;
    }

    Promise.all([
      api.getCustomerOrders(),
      api.getCustomerReturns().catch(() => ({ returns: [] })),
    ])
      .then(([ordersData, returnsData]) => {
        setOrders(ordersData.orders || []);
        const byOrderId = (returnsData.returns || []).reduce(
          (acc: Record<string, CustomerReturn>, item: CustomerReturn) => {
            acc[item.order_id] = item;
            return acc;
          },
          {}
        );
        setReturnsByOrderId(byOrderId);
        setOrdersLoading(false);
      })
      .catch(() => {
        setOrders([]);
        setReturnsByOrderId({});
        setOrdersLoading(false);
      });
  }, [customer, loading]);

  // Calculate pagination
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const paginatedOrders = orders.slice(
    startIndex,
    startIndex + ORDERS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of orders list
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading || !customer) return <OrdersListSkeleton />;

  return (
    <div className="min-h-screen bg-parchment py-token-xl md:py-token-2xl lg:py-token-3xl">
      <div className="mx-auto max-w-4xl px-home-mobile md:px-home-tablet lg:px-home-desktop">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/account"
            className="account-muted flex items-center gap-2 transition-colors hover:text-primary"
          >
            <ChevronLeft size={20} />
            <span>Back to Account</span>
          </Link>
        </div>

        <Heading role="page" className="account-page-title mb-8">My Orders</Heading>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/help"
            className="border border-border bg-surface-paper px-4 py-2 text-body-xs font-bold  tracking-token-wider text-primary transition-colors hover:bg-parchment"
          >
            Help Center
          </Link>
          <Link
            href="/payment-help"
            className="border border-border bg-surface-paper px-4 py-2 text-body-xs font-bold  tracking-token-wider text-primary transition-colors hover:bg-parchment"
          >
            Payment Help
          </Link>
          <Link
            href="/returns"
            className="border border-border bg-surface-paper px-4 py-2 text-body-xs font-bold  tracking-token-wider text-primary transition-colors hover:bg-parchment"
          >
            View Returns Hub
          </Link>
        </div>

        {/* Orders List */}
        <Card className="overflow-hidden shadow-sm">
          {ordersLoading ? (
            <div className="divide-y divide-[var(--ds-border-subtle)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-6">
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-surface-warm animate-pulse rounded" />
                    <div className="h-3 w-24 bg-surface-warm animate-pulse rounded" />
                  </div>
                  <div className="h-8 w-24 bg-surface-warm animate-pulse rounded" />
                </div>
              ))}
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
            <>
              <div className="divide-y divide-[var(--ds-border-subtle)]">
                {paginatedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-6 transition-colors hover:bg-parchment"
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
                          {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </p>
                      <p className="account-caption mt-1">
                        {order.items?.length || 0} items
                      </p>
                      {returnsByOrderId[order.id] ? (
                        <Badge
                          className={`mt-3 inline-flex rounded-full border px-3 py-1 text-body-xs font-semibold tracking-token-wide ${getReturnStatusClasses(
                            returnsByOrderId[order.id].status
                          )}`}
                        >
                          Return {returnsByOrderId[order.id].status}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="account-name">
                        {new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: order.currency_code?.toUpperCase() || 'INR',
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between">
                  <p className="account-muted">
                    Showing {startIndex + 1}-
                    {Math.min(startIndex + ORDERS_PER_PAGE, orders.length)} of{' '}
                    {orders.length} orders
                  </p>
                  <div className="flex items-center gap-2">
                    <IconButton
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="ghost"
                      size="sm"
                      className="rounded-md border border-border-subtle text-secondary hover:bg-parchment"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </IconButton>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          variant={
                            currentPage === page ? 'paginationSelected' : 'pagination'
                          }
                          size="none"
                          className="catalog-count"
                        >
                          {page}
                        </Button>
                      )
                    )}

                    <IconButton
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="ghost"
                      size="sm"
                      className="rounded-md border border-border-subtle text-secondary hover:bg-parchment"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </IconButton>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
