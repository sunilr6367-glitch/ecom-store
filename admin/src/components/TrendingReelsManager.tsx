'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import {
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

interface TrendingReel {
  id: string;
  video_url: string;
  thumbnail_url: string;
  product_id: string | null;
  product_name: string;
  price: string;
  price_amount: number | null;
  link_url: string;
  view_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface ProductOptionPrice {
  amount?: number;
}

interface ProductOptionVariant {
  prices?: ProductOptionPrice[];
}

interface ProductSummary {
  id: string;
  title: string;
  handle: string;
  variants?: ProductOptionVariant[];
}

interface ReelFormState {
  productName: string;
  productId: string;
  price: string;
  priceAmount: string;
  linkUrl: string;
  sortOrder: string;
  isActive: boolean;
  videoFile: File | null;
  thumbnailFile: File | null;
  videoName: string;
  thumbnailPreview: string;
}

const emptyForm = (): ReelFormState => ({
  productName: '',
  productId: '',
  price: '',
  priceAmount: '',
  linkUrl: '',
  sortOrder: '0',
  isActive: true,
  videoFile: null,
  thumbnailFile: null,
  videoName: '',
  thumbnailPreview: '',
});

export default function TrendingReelsManager() {
  const [reels, setReels] = useState<TrendingReel[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<TrendingReel | null>(null);
  const [form, setForm] = useState<ReelFormState>(emptyForm);
  const previewUrlRef = useRef<string>('');
  
  useEffect(() => {
    void loadReels();
    void loadProducts();

    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  async function loadReels() {
    try {
      setLoading(true);
      const response = await api.getTrendingReels();
      setReels(response.reels || []);
    } catch (error) {
      console.error('Failed to load trending reels:', error);
      alert('Failed to load trending reels');
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const p = await api.getProducts(100);
      setProducts(
        Array.isArray(p?.data)
          ? p.data
          : p?.data?.products || p?.products || []
      );
    } catch (e) {
      console.error('Failed to load products for dropdown', e);
    }
  }

  function resetPreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
  }

  function openCreateModal() {
    resetPreviewUrl();
    setEditingReel(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  }

  function openEditModal(reel: TrendingReel) {
    resetPreviewUrl();
    setEditingReel(reel);
    setForm({
      productName: reel.product_name,
      productId: reel.product_id ?? '',
      price: reel.price,
      priceAmount: reel.price_amount != null ? String(reel.price_amount) : '',
      linkUrl: reel.link_url,
      sortOrder: String(reel.sort_order),
      isActive: reel.is_active,
      videoFile: null,
      thumbnailFile: null,
      videoName: reel.video_url.split('/').pop() || 'Current video uploaded',
      thumbnailPreview: reel.thumbnail_url,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    resetPreviewUrl();
    setIsModalOpen(false);
    setEditingReel(null);
    setForm(emptyForm());
  }

  function handleVideoChange(file: File | null) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('Video must be 50MB or smaller');
      return;
    }

    setForm((current) => ({
      ...current,
      videoFile: file,
      videoName: file.name,
    }));
  }

  function handleThumbnailChange(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Thumbnail must be 5MB or smaller');
      return;
    }

    resetPreviewUrl();
    const nextPreview = URL.createObjectURL(file);
    previewUrlRef.current = nextPreview;

    setForm((current) => ({
      ...current,
      thumbnailFile: file,
      thumbnailPreview: nextPreview,
    }));
  }

  function buildFormData() {
    const formData = new FormData();
    formData.append('product_name', form.productName);
    if (form.productId) {
      formData.append('product_id', form.productId);
    }
    formData.append('price', form.price);
    if (form.priceAmount.trim()) {
      formData.append('price_amount', form.priceAmount.trim());
    }
    formData.append('link_url', form.linkUrl);
    formData.append('sort_order', form.sortOrder || '0');
    formData.append('is_active', String(form.isActive));

    if (form.videoFile) {
      formData.append('video', form.videoFile);
    }

    if (form.thumbnailFile) {
      formData.append('thumbnail', form.thumbnailFile);
    }

    return formData;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!editingReel && !form.videoFile) {
      alert('Please choose a video file');
      return;
    }

    if (!editingReel && !form.thumbnailFile) {
      alert('Please choose a thumbnail image');
      return;
    }

    try {
      setSaving(true);

      if (editingReel) {
        await api.updateTrendingReel(editingReel.id, buildFormData());
      } else {
        await api.createTrendingReel(buildFormData());
      }

      closeModal();
      void loadReels().catch((refreshError) => {
        console.warn('Saved trending reel, but refresh failed:', refreshError);
        alert('Saved trending reel, but the list could not refresh. Reload the page to see the update.');
      });
    } catch (error) {
      console.error('Failed to save trending reel:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to save trending reel'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      setTogglingId(id);
      await api.toggleTrendingReel(id);
      await loadReels();
    } catch (error) {
      console.error('Failed to toggle trending reel:', error);
      alert('Failed to toggle trending reel');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this trending reel?')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.deleteTrendingReel(id);
      await loadReels();
    } catch (error) {
      console.error('Failed to delete trending reel:', error);
      alert('Failed to delete trending reel');
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = reels.filter((reel) => reel.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trending Reels</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage the vertical video cards shown below the hero banner.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add New Reel
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Reels</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{reels.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {reels.length - activeCount}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
          Loading trending reels...
        </div>
      ) : reels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Film size={24} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No trending reels yet
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Add your first reel to create the homepage video strip.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add New Reel
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reels.map((reel) => (
            <div
              key={reel.id}
              className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-[220px_1fr_auto]"
            >
              <div className="relative h-[280px] overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={reel.thumbnail_url}
                  alt={reel.product_name}
                  fill
                  sizes="220px"
                  className="object-cover"
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    Sort #{reel.sort_order}
                  </span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {reel.view_count || 0} views
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      reel.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {reel.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {reel.product_name}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-gray-700">
                    {reel.price}
                  </p>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p className="break-all">
                    <span className="font-medium text-gray-900">Video:</span>{' '}
                    {reel.video_url}
                  </p>
                  <p className="break-all">
                    <span className="font-medium text-gray-900">Link:</span>{' '}
                    {reel.link_url}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:w-40">
                <button
                  type="button"
                  onClick={() => handleToggle(reel.id)}
                  disabled={togglingId === reel.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reel.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  {togglingId === reel.id
                    ? 'Updating...'
                    : reel.is_active
                      ? 'Deactivate'
                      : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(reel)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(reel.id)}
                  disabled={deletingId === reel.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  {deletingId === reel.id ? 'Deleting...' : 'Delete'}
                </button>
                <a
                  href={reel.link_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                >
                  <ExternalLink size={16} />
                  Open Link
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingReel ? 'Edit Trending Reel' : 'Add Trending Reel'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Upload a vertical product video and thumbnail for the homepage reel strip.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close trending reel form"
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Reel Video {editingReel ? '' : '*'}
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-4 transition hover:border-blue-400 hover:bg-blue-50/40">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Upload size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {form.videoName || 'Choose MP4 or MOV video'}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Vertical reels work best. Max 50MB.
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".mp4,.mov,video/mp4,video/quicktime"
                        className="hidden"
                        onChange={(event) =>
                          handleVideoChange(event.target.files?.[0] || null)
                        }
                      />
                    </label>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Thumbnail {editingReel ? '' : '*'}
                    </label>
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                      {form.thumbnailPreview ? (
                        // Local object URLs are only used for temporary client-side preview.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.thumbnailPreview}
                          alt="Thumbnail preview"
                          className="mb-4 h-[240px] w-[180px] rounded-xl object-cover"
                        />
                      ) : (
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                          <Film size={24} />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        Click to choose thumbnail image
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        JPG, PNG, or WEBP up to 5MB
                      </span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) =>
                          handleThumbnailChange(event.target.files?.[0] || null)
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Linked Product
                    </label>
                    <select
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 mb-4"
                      value={form.productId}
                      onChange={(e) => {
                        const product = products.find((p) => p.id === e.target.value);
                        if (product) {
                          const firstPrice = product.variants?.[0]?.prices?.[0]?.amount;
                          setForm((cur) => ({
                            ...cur,
                            productName: product.title,
                            productId: product.id,
                            linkUrl: `/products/${product.handle}`,
                            price:
                              typeof firstPrice === 'number'
                                ? `Rs. ${firstPrice / 100}`
                                : 'Rs. ',
                            priceAmount:
                              typeof firstPrice === 'number'
                                ? String(firstPrice)
                                : '',
                          }));
                        } else {
                          setForm((cur) => ({ ...cur, productId: '' }));
                        }
                      }}
                    >
                      <option value="">-- Select Product to auto-fill --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Product Name
                    </label>
                    <p className="mb-2 text-xs text-gray-500">
                      This title is shown on the storefront reel card and inside the reel player.
                    </p>
                    <input
                      value={form.productName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          productName: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Mulmul Summer Dress"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Price Label
                    </label>
                    <input
                      value={form.price}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Rs. 5,999"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Price Amount <span className="text-gray-400 font-normal">(INR paise — for currency conversion)</span>
                    </label>
                    <p className="mb-2 text-xs text-gray-500">
                      Enter price in paise e.g. ₹5,999 → type 599900. Auto-filled when you select a product above.
                    </p>
                    <input
                      type="number"
                      min="0"
                      value={form.priceAmount}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          priceAmount: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="599900"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Link URL
                    </label>
                    <p className="mb-2 text-xs text-gray-500">
                      This product URL powers the Buy Now action on the trending reel experience.
                    </p>
                    <input
                      value={form.linkUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          linkUrl: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="/products/mulmul-summer-dress"
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.sortOrder}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            sortOrder: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div className="flex items-end">
                      <label className="inline-flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              isActive: event.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Active on storefront
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? form.videoFile
                      ? 'Uploading video… (may take a minute)'
                      : editingReel
                        ? 'Saving...'
                        : 'Creating...'
                    : editingReel
                      ? 'Save Changes'
                      : 'Create Reel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
