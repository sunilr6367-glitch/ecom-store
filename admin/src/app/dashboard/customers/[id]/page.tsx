'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  MetricCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
  Surface,
} from '@/components/ui/admin-ui';

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  has_account: boolean;
  created_at: string;
}

interface Address {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  address_1: string;
  address_2: string | null;
  city: string;
  province: string | null;
  postal_code: string;
  country_code: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

interface CustomerStats {
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  last_order_date: string | null;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        setLoading(true);
        const data = await api.getCustomer(customerId);
        setCustomer(data.customer || null);
        setAddresses(data.addresses || []);
        setOrders(data.orders || []);
        setStats(data.stats || null);
      } catch (error) {
        console.error('Failed to load customer detail:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadCustomer();
  }, [customerId]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount / 100);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="px-4 pb-8 md:px-8">
        <PageHeader
          eyebrow="Customers"
          title="Customer detail"
          description="Loading profile, addresses, and order history."
        />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="px-4 pb-8 md:px-8">
        <PageHeader
          eyebrow="Customers"
          title="Customer not found"
          description="The requested customer could not be loaded."
        />
      </div>
    );
  }

  const customerName =
    customer.first_name && customer.last_name
      ? `${customer.first_name} ${customer.last_name}`
      : 'Customer';

  return (
    <div className="space-y-6 px-4 pb-8 md:space-y-8 md:px-8">
      <div className="pt-2">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--kv-muted)] hover:text-[var(--kv-text)]"
        >
          <ArrowLeft size={16} />
          Back to customers
        </Link>
      </div>

      <PageHeader
        eyebrow="Customer detail"
        title={customerName}
        description={`Profile record for ${customer.email}. Review addresses, spend, and the full order timeline from one place.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total orders"
          value={stats?.total_orders || 0}
          icon={ShoppingBag}
        />
        <MetricCard
          label="Total spent"
          value={formatCurrency(stats?.total_spent || 0)}
          icon={ShoppingBag}
          tone="accent"
        />
        <MetricCard
          label="Average order"
          value={formatCurrency(stats?.average_order_value || 0)}
          icon={ShoppingBag}
        />
        <MetricCard
          label="Last order"
          value={stats?.last_order_date ? formatDate(stats.last_order_date) : 'No orders'}
          icon={Calendar}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
        <div className="space-y-6">
          <Surface className="overflow-hidden">
            <SectionHeader title="Profile" />
            <div className="space-y-4 px-5 py-5 md:px-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--kv-soft)] text-[var(--kv-accent-deep)]">
                  <User size={18} />
                </div>
                <div>
                  <p className="font-semibold text-[var(--kv-text)]">
                    {customerName}
                  </p>
                  <p className="text-sm text-[var(--kv-muted)]">{customer.email}</p>
                </div>
              </div>

              <div className="space-y-3 rounded-[1.2rem] bg-[var(--kv-soft)] px-4 py-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 text-[var(--kv-muted)]" />
                  <div>
                    <p className="font-medium text-[var(--kv-text)]">Email</p>
                    <p className="text-[var(--kv-muted)]">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={16} className="mt-0.5 text-[var(--kv-muted)]" />
                  <div>
                    <p className="font-medium text-[var(--kv-text)]">Phone</p>
                    <p className="text-[var(--kv-muted)]">
                      {customer.phone || 'No phone on file'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar
                    size={16}
                    className="mt-0.5 text-[var(--kv-muted)]"
                  />
                  <div>
                    <p className="font-medium text-[var(--kv-text)]">Joined</p>
                    <p className="text-[var(--kv-muted)]">
                      {formatDate(customer.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <StatusBadge status={customer.has_account ? 'active' : 'inactive'} />
            </div>
          </Surface>

          <Surface className="overflow-hidden">
            <SectionHeader title="Addresses" />
            <div className="space-y-3 px-5 py-5 md:px-6">
              {addresses.length === 0 ? (
                <p className="text-sm text-[var(--kv-muted)]">
                  No saved addresses.
                </p>
              ) : (
                addresses.map((address) => (
                  <div
                    key={address.id}
                    className="rounded-[1.2rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-text)]"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin
                        size={16}
                        className="mt-0.5 text-[var(--kv-muted)]"
                      />
                      <div className="leading-6">
                        <p className="font-medium">
                          {address.first_name} {address.last_name}
                        </p>
                        {address.company ? <p>{address.company}</p> : null}
                        <p>{address.address_1}</p>
                        {address.address_2 ? <p>{address.address_2}</p> : null}
                        <p>
                          {address.city}, {address.province} {address.postal_code}
                        </p>
                        <p>{address.country_code}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Surface>
        </div>

        <Surface className="overflow-hidden">
          <SectionHeader
            title="Order history"
            description="Every order placed by this customer."
          />
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[var(--kv-border)] text-left text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-14 text-center text-sm text-[var(--kv-muted)]"
                    >
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[var(--kv-border)]/70 text-sm text-[var(--kv-text)]"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="font-semibold hover:text-[var(--kv-accent-deep)]"
                        >
                          #{order.order_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[var(--kv-muted)]">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {orders.length === 0 ? (
              <p className="rounded-2xl bg-[var(--kv-soft)] px-4 py-6 text-center text-sm text-[var(--kv-muted)]">
                No orders yet.
              </p>
            ) : (
              orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="block rounded-[1.2rem] border border-[var(--kv-border)] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--kv-text)]">
                        #{order.order_number}
                      </p>
                      <p className="mt-1 text-xs text-[var(--kv-muted)]">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[var(--kv-text)]">
                    {formatCurrency(order.total)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Surface>
      </div>
    </div>
  );
}
