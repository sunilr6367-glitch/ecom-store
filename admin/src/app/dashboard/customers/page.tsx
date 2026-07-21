'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Mail, Phone, Search, Trash2, UserPen, Users, X } from 'lucide-react';
import { exportToCSV, formatCustomersForExport } from '@/lib/csv-export';
import { api } from '@/lib/api';

type CustomerFilter = 'all' | 'registered' | 'guest';

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  has_account: boolean;
  created_at: string;
  order_count: number;
  total_spent: number;
}

interface CustomerStats {
  total_customers: number;
  customers_with_accounts: number;
  guest_customers: number;
  new_this_month: number;
  customers_with_orders: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editFormData, setEditFormData] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers(page, search, filter);
      setCustomers(data.customers || data || []);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setCustomers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  const fetchStats = async () => {
    try {
      const data = await api.getCustomerStats();
      setStats(data || null);
    } catch (error) { console.error('Failed to load customer stats:', error); }
  };

  useEffect(() => { void fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { void fetchStats(); }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  const getCustomerName = (c: Customer) =>
    c.first_name && c.last_name ? `${c.first_name} ${c.last_name}` : 'Unnamed customer';

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setEditFormData({ first_name: c.first_name || '', last_name: c.last_name || '', email: c.email || '', phone: c.phone || '' });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      setSavingEdit(true);
      await api.updateCustomer(editingCustomer.id, editFormData);
      setEditingCustomer(null);
      await Promise.all([fetchCustomers(), fetchStats()]);
    } catch (error) { console.error('Failed to update customer:', error); }
    finally { setSavingEdit(false); }
  };

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    try {
      setDeleting(true);
      await api.deleteCustomer(deletingCustomer.id);
      setDeletingCustomer(null);
      await Promise.all([fetchCustomers(), fetchStats()]);
    } catch (error) { console.error('Failed to delete customer:', error); }
    finally { setDeleting(false); }
  };

  const FILTER_TABS: { label: string; value: CustomerFilter; count: number }[] = [
    { label: 'All',        value: 'all',        count: stats?.total_customers || 0 },
    { label: 'Registered', value: 'registered', count: stats?.customers_with_accounts || 0 },
    { label: 'Guest',      value: 'guest',      count: stats?.guest_customers || 0 },
  ];

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">

      {/* ── Heading ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[2.75rem] font-black leading-none tracking-tight text-[var(--on-surface)]">
            Customers
          </h2>
          <p className="mt-2 text-sm font-medium text-[var(--on-surface-variant)]">
            Browse buyers, view lifetime order history, and manage profiles.
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportToCSV(formatCustomersForExport(customers), 'customers')}
          className="flex items-center gap-1.5 rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors self-start"
        >
          <Download size={13} /> Export CSV
        </button>
      </section>

      {/* ── Stats bento ── */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total',         value: stats?.total_customers || 0 },
          { label: 'Registered',    value: stats?.customers_with_accounts || 0 },
          { label: 'Guest',         value: stats?.guest_customers || 0 },
          { label: 'New this month',value: stats?.new_this_month || 0 },
        ].map((card) => (
          <div key={card.label} className="bg-[var(--surface-container-lowest)] p-5 rounded-xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] flex flex-col gap-3">
            <Users size={18} className="text-[var(--on-surface-variant)]" />
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">{card.label}</p>
              <p className="text-xl font-black mt-0.5 text-[var(--on-surface)]">{card.value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Filters ── */}
      <section className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => { setFilter(tab.value); setPage(1); }}
              className={`rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                filter === tab.value
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" />
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] pl-10 pr-4 py-2.5 text-xs text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          />
        </div>
      </section>

      {/* ── Customer list ── */}
      {/* Desktop table */}
      <section className="hidden md:block bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[var(--surface-container-low)] text-left">
                {['Customer', 'Contact', 'Type', 'Orders', 'Spent', 'Joined', ''].map((h) => (
                  <th key={h} className="px-5 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-14 text-center text-sm text-[var(--on-surface-variant)]">Loading customers…</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-14 text-center text-sm text-[var(--on-surface-variant)]">No customers match the current filters.</td></tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-[var(--surface-container-low)] hover:bg-[var(--surface-container-low)]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[var(--primary-container)] text-[var(--on-primary-container)] flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {(customer.first_name?.[0] || customer.email?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/dashboard/customers/${customer.id}`} className="text-xs font-bold text-[var(--on-surface)] hover:text-[var(--primary)] transition-colors">
                            {getCustomerName(customer)}
                          </Link>
                          <p className="text-[10px] text-[var(--on-surface-variant)]">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1 text-[10px] text-[var(--on-surface-variant)]">
                        <p className="flex items-center gap-1.5"><Mail size={11} />{customer.email}</p>
                        <p className="flex items-center gap-1.5"><Phone size={11} />{customer.phone || '—'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        customer.has_account
                          ? 'bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]'
                          : 'bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]'
                      }`}>
                        {customer.has_account ? 'Registered' : 'Guest'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-[var(--on-surface)]">{customer.order_count}</td>
                    <td className="px-5 py-4 text-xs font-bold text-[var(--on-surface)]">{formatCurrency(customer.total_spent)}</td>
                    <td className="px-5 py-4 text-[10px] text-[var(--on-surface-variant)]">{formatDate(customer.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link href={`/dashboard/customers/${customer.id}`}
                          className="rounded-full border border-[var(--outline-variant)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]">
                          View
                        </Link>
                        <button type="button" onClick={() => openEdit(customer)}
                          className="h-8 w-8 rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] flex items-center justify-center text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]">
                          <UserPen size={13} />
                        </button>
                        <button type="button" onClick={() => setDeletingCustomer(customer)}
                          className="h-8 w-8 rounded-full border border-[var(--error)]/20 bg-[var(--error-container)] flex items-center justify-center text-[var(--on-error-container)] hover:opacity-80">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--surface-container-low)] px-5 py-4 text-xs">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-full border border-[var(--outline-variant)] px-4 py-2 font-bold text-[var(--on-surface)] disabled:opacity-40">
              Previous
            </button>
            <span className="text-[var(--on-surface-variant)]">Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="rounded-full border border-[var(--outline-variant)] px-4 py-2 font-bold text-[var(--on-surface)] disabled:opacity-40">
              Next
            </button>
          </div>
        )}
      </section>

      {/* Mobile card list */}
      <section className="md:hidden space-y-3">
        {loading ? (
          <p className="rounded-xl bg-[var(--surface-container-lowest)] px-4 py-6 text-center text-sm text-[var(--on-surface-variant)]">Loading customers…</p>
        ) : customers.length === 0 ? (
          <p className="rounded-xl bg-[var(--surface-container-lowest)] px-4 py-6 text-center text-sm text-[var(--on-surface-variant)]">No customers match the current filters.</p>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--primary-container)] text-[var(--on-primary-container)] flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {(customer.first_name?.[0] || customer.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <Link href={`/dashboard/customers/${customer.id}`} className="text-xs font-bold text-[var(--on-surface)]">{getCustomerName(customer)}</Link>
                    <p className="text-[10px] text-[var(--on-surface-variant)]">{customer.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${customer.has_account ? 'bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]' : 'bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]'}`}>
                  {customer.has_account ? 'Reg' : 'Guest'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-[var(--surface-container-low)] px-3 py-2">
                  <p className="text-[10px] text-[var(--on-surface-variant)]">Orders</p>
                  <p className="font-bold text-[var(--on-surface)]">{customer.order_count}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-container-low)] px-3 py-2">
                  <p className="text-[10px] text-[var(--on-surface-variant)]">Spent</p>
                  <p className="font-bold text-[var(--on-surface)]">{formatCurrency(customer.total_spent)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/customers/${customer.id}`}
                  className="flex-1 rounded-full border border-[var(--outline-variant)] py-2 text-center text-[9px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]">
                  View
                </Link>
                <button type="button" onClick={() => openEdit(customer)}
                  className="rounded-full border border-[var(--outline-variant)] px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]">
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs pt-2">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-full border border-[var(--outline-variant)] px-4 py-2 font-bold text-[var(--on-surface)] disabled:opacity-40">
              Previous
            </button>
            <span className="text-[var(--on-surface-variant)]">Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="rounded-full border border-[var(--outline-variant)] px-4 py-2 font-bold text-[var(--on-surface)] disabled:opacity-40">
              Next
            </button>
          </div>
        )}
      </section>

      {/* ── Edit modal ── */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_24px_48px_rgba(25,28,30,0.2)] p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">Edit customer</p>
                <h2 className="text-xl font-black mt-1 text-[var(--on-surface)]">{getCustomerName(editingCustomer)}</h2>
              </div>
              <button onClick={() => setEditingCustomer(null)} className="text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={editFormData.first_name} onChange={(e) => setEditFormData((p) => ({ ...p, first_name: e.target.value }))}
                  placeholder="First name"
                  className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
                <input value={editFormData.last_name} onChange={(e) => setEditFormData((p) => ({ ...p, last_name: e.target.value }))}
                  placeholder="Last name"
                  className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
              </div>
              <input type="email" value={editFormData.email} onChange={(e) => setEditFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email"
                className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
              <input value={editFormData.phone} onChange={(e) => setEditFormData((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone"
                className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingCustomer(null)}
                  className="rounded-full border border-[var(--outline-variant)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[var(--on-surface)]">
                  Cancel
                </button>
                <button type="submit" disabled={savingEdit}
                  className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60">
                  {savingEdit ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_24px_48px_rgba(25,28,30,0.2)] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--error)]">Delete customer</p>
                <h2 className="text-lg font-black mt-1 text-[var(--on-surface)]">{getCustomerName(deletingCustomer)}</h2>
                <p className="mt-1 text-xs text-[var(--on-surface-variant)]">This permanently removes the customer record.</p>
              </div>
              <button onClick={() => setDeletingCustomer(null)} className="text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"><X size={18} /></button>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeletingCustomer(null)}
                className="rounded-full border border-[var(--outline-variant)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[var(--on-surface)]">
                Cancel
              </button>
              <button type="button" onClick={() => void handleDelete()} disabled={deleting}
                className="rounded-full bg-[var(--error)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
