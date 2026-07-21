'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Crown,
  Plus,
  Edit2,
  Trash2,
  Users,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';

interface Tier {
  id: string;
  name: string;
  slug: string;
  discount_percent: number;
  min_order_value: number;
  min_order_quantity: number;
  default_moq: number;
  payment_terms: string;
  description: string | null;
  color: string;
  active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface TierStats {
  tier: string;
  slug: string;
  customerCount: number;
  orderCount: number;
  discountPercent: number;
}

const PAYMENT_TERMS = [
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_45', label: 'Net 45' },
  { value: 'net_60', label: 'Net 60' },
];

export default function TierManagementPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [stats, setStats] = useState<TierStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    discount_percent: 20,
    min_order_value: 0,
    min_order_quantity: 0,
    default_moq: 50,
    payment_terms: 'net_30',
    description: '',
    color: '#3B82F6',
    active: true,
    priority: 0,
  });

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      const [tiersData, statsData] = await Promise.all([
        api.getWholesaleTiers(),
        api.getWholesaleTierStats(),
      ]);
      setTiers(tiersData.tiers || []);
      setStats(statsData.stats || []);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const result = await api.createWholesaleTier(formData);
      if (result.tier) {
        setSuccess('Tier created successfully');
        setShowModal(false);
        resetForm();
        fetchTiers();
      } else {
        setError(result.error || 'Failed to create tier');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;

    setError('');
    setSuccess('');

    try {
      const result = await api.updateWholesaleTier(editingTier.id, formData);
      if (result.tier) {
        setSuccess('Tier updated successfully');
        setShowModal(false);
        setEditingTier(null);
        resetForm();
        fetchTiers();
      } else {
        setError(result.error || 'Failed to update tier');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this tier? This will affect all customers assigned to this tier.'
      )
    ) {
      return;
    }

    try {
      await api.deleteWholesaleTier(id);
      setSuccess('Tier deleted successfully');
      fetchTiers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete tier');
    }
  };

  const openCreateModal = () => {
    setEditingTier(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (tier: Tier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      slug: tier.slug,
      discount_percent: tier.discount_percent,
      min_order_value: tier.min_order_value,
      min_order_quantity: tier.min_order_quantity,
      default_moq: tier.default_moq,
      payment_terms: tier.payment_terms,
      description: tier.description || '',
      color: tier.color,
      active: tier.active,
      priority: tier.priority,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      discount_percent: 20,
      min_order_value: 0,
      min_order_quantity: 0,
      default_moq: 50,
      payment_terms: 'net_30',
      description: '',
      color: '#3B82F6',
      active: true,
      priority: 0,
    });
    setError('');
  };

  const getTierStats = (slug: string) => {
    return (
      stats.find((s) => s.slug === slug) || {
        customerCount: 0,
        orderCount: 0,
        discountPercent: 0,
      }
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Wholesale Tier Management
          </h1>
          <p className="text-gray-600">Configure discount tiers and benefits</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Tier
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {/* Tiers Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading tiers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const tierStats = getTierStats(tier.slug);
            return (
              <div
                key={tier.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all hover:shadow-lg ${
                  tier.active
                    ? 'border-transparent'
                    : 'border-gray-300 opacity-75'
                }`}
              >
                <div className="h-2" style={{ backgroundColor: tier.color }} />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <Crown
                        className="w-5 h-5"
                        style={{ color: tier.color }}
                      />
                      <h3 className="text-lg font-bold text-gray-900">
                        {tier.name}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(tier)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tier.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Discount</span>
                      <span
                        className="text-2xl font-bold"
                        style={{ color: tier.color }}
                      >
                        {tier.discount_percent}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Default MOQ</span>
                      <span className="font-medium">
                        {tier.default_moq} units
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Terms</span>
                      <span className="font-medium capitalize">
                        {tier.payment_terms.replace('_', ' ')}
                      </span>
                    </div>

                    {tier.min_order_value > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Min Order Value</span>
                        <span className="font-medium">
                          {formatCurrency(tier.min_order_value)}
                        </span>
                      </div>
                    )}

                    {tier.min_order_quantity > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Min Order Qty</span>
                        <span className="font-medium">
                          {tier.min_order_quantity} units
                        </span>
                      </div>
                    )}
                  </div>

                  {tier.description && (
                    <p className="mt-4 text-sm text-gray-500">
                      {tier.description}
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {tierStats.customerCount} customers
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {tierStats.orderCount} orders
                      </span>
                    </div>
                  </div>

                  {!tier.active && (
                    <div className="mt-3 px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full inline-block">
                      Inactive
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTier ? 'Edit Tier' : 'Create New Tier'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={editingTier ? handleUpdate : handleCreate}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Premium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug * (unique identifier)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    disabled={!!editingTier}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="e.g., premium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount % *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formData.discount_percent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_percent: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default MOQ *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.default_moq}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        default_moq: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms *
                  </label>
                  <select
                    value={formData.payment_terms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_terms: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {PAYMENT_TERMS.map((term) => (
                      <option key={term.value} value={term.value}>
                        {term.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Order Value ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.min_order_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_order_value: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Order Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_order_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_order_quantity: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="active"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    Active
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the benefits of this tier..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTier ? 'Update Tier' : 'Create Tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
