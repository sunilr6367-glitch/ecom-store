'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users,
  Mail,
  Phone,
  Building2,
  Crown,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface WholesaleCustomer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company_name: string | null;
  discount_tier: string | null;
  wholesale_inquiry_id: string | null;
  created_at: string;
  email_verified: boolean;
}

export default function WholesaleCustomersPage() {
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    starter: 0,
    growth: 0,
    enterprise: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const searchRef = useRef(search);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const [customersData, statsData] = await Promise.all([
        api.getWholesaleCustomers(searchRef.current, tierFilter, page),
        api.getWholesaleCustomerStats(),
      ]);
      setCustomers(customersData.customers || []);
      setPagination(
        customersData.pagination || { page: 1, limit: 20, total: 0, pages: 1 }
      );
      setStats(statsData || { total: 0, starter: 0, growth: 0, enterprise: 0 });
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [page, tierFilter]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void fetchCustomers();
  };

  const handleTierChange = async (customerId: string, newTier: string) => {
    try {
      await api.updateWholesaleCustomerTier(customerId, newTier);
      setCustomers(
        customers.map((c) =>
          c.id === customerId ? { ...c, discount_tier: newTier } : c
        )
      );
      setEditingTier(null);
      void fetchCustomers();
    } catch (error) {
      console.error('Error updating tier:', error);
    }
  };

  const getTierBadge = (tier: string | null) => {
    const tiers: Record<string, { bg: string; text: string; label: string }> = {
      starter: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'Starter (20%)',
      },
      growth: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        label: 'Growth (30%)',
      },
      enterprise: {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        label: 'Enterprise (40%)',
      },
    };

    if (!tier || !tiers[tier]) {
      return <span className="text-gray-400 text-sm">Not assigned</span>;
    }

    const t = tiers[tier];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.bg} ${t.text}`}
      >
        {t.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Wholesale Customers
        </h1>
        <p className="text-gray-600">Manage approved wholesale customers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Crown className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Starter</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.starter}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Growth</p>
              <p className="text-2xl font-bold text-gray-900">{stats.growth}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Enterprise</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.enterprise}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>
          <select
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Tiers</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No wholesale customers found
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 font-medium">
                          {customer.first_name?.[0] ||
                            customer.email?.[0]?.toUpperCase() ||
                            '?'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.company_name ? (
                      <div className="flex items-center text-sm text-gray-900">
                        <Building2 className="w-4 h-4 mr-1 text-gray-400" />
                        {customer.company_name}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingTier === customer.id ? (
                      <select
                        value={customer.discount_tier || ''}
                        onChange={(e) =>
                          handleTierChange(customer.id, e.target.value)
                        }
                        onBlur={() => setEditingTier(null)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                        autoFocus
                      >
                        <option value="">Select tier</option>
                        <option value="starter">Starter (20%)</option>
                        <option value="growth">Growth (30%)</option>
                        <option value="enterprise">Enterprise (40%)</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingTier(customer.id)}
                        className="hover:opacity-75"
                      >
                        {getTierBadge(customer.discount_tier)}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.email_verified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page === 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page === pagination.pages}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
