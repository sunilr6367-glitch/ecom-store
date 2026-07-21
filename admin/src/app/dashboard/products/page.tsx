'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Grid2X2,
  List,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  MoreVertical,
  Copy,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Edit2,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';

type ListingFilter = 'all' | 'published' | 'draft' | 'out_of_stock';
type ViewMode = 'grid' | 'list';
type SortMode = 'newest' | 'price' | 'stock';

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  thumbnail: string | null;
  created_at: string;
  variant_count: number;
  total_inventory: number;
  prices?: Array<{ amount: number; currency_code?: string }>;
  price?: number | { amount?: number; currency_code?: string };
  sku?: string;
  categories?: { name: string }[];
  variants?: Array<{ id: string; title: string; inventory_quantity: number; sku?: string; prices?: Array<{ amount: number }> }>;
}

interface ProductStats {
  total_products: number;
  published_products: number;
  draft_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface CollectionOption {
  id: string;
  title: string;
}

/* ── Status helpers ── */
function toDisplayUrl(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  if (url.includes('/f_auto')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
}

const STATUS_STYLE: Record<string, { badge: string; border: string }> = {
  published: { badge: 'bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]', border: 'border-[var(--tertiary-container)]' },
  draft:     { badge: 'bg-[var(--secondary-container)] text-[var(--on-secondary-container)]', border: 'border-[var(--secondary-container)]' },
  archived:  { badge: 'bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]', border: 'border-[var(--surface-container-high)]' },
};
function getStatusStyle(status: string) {
  return STATUS_STYLE[status] ?? STATUS_STYLE.draft;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') as ListingFilter) ?? 'all';
  const viewMode = (searchParams.get('view') as ViewMode) ?? 'grid';
  const sortMode = (searchParams.get('sort') as SortMode) ?? 'newest';
  const categoryFilter = searchParams.get('category') ?? 'all';
  const collectionFilter = searchParams.get('collection') ?? 'all';
  const page = Number(searchParams.get('page') ?? '1');

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === '' || value === 'all' || value === 'grid' || value === 'newest' || (key === 'page' && value === '1')) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    if (key !== 'page') params.delete('page');
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const setSearch = (v: string) => setParam('q', v);
  const setStatusFilter = (v: ListingFilter) => setParam('status', v);
  const setViewMode = (v: ViewMode) => setParam('view', v);
  const setSortMode = (v: SortMode) => setParam('sort', v);
  const setCategoryFilter = (v: string) => setParam('category', v);
  const setCollectionFilter = (v: string) => setParam('collection', v);
  const setPage = (v: number) => setParam('page', String(v));

  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActionRunning, setIsBulkActionRunning] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlinePrice, setInlinePrice] = useState<string>('');
  const [inlineStock, setInlineStock] = useState<string>('');
  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(null);
  const [variantsCache, setVariantsCache] = useState<Record<string, any[]>>({});
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [quickViewProductId, setQuickViewProductId] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);


  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoryData, collectionData] = await Promise.all([
          api.getCategories(),
          api.getCollections(),
        ]);
        setCategories(categoryData.categories || []);
        setCollections(collectionData.collections || []);
      } catch (error) {
        console.error('Failed to load product filters:', error);
      }
    };
    void loadFilters();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const limit = 20;
      const offset = (page - 1) * limit;
      const statusParam = statusFilter === 'out_of_stock' ? 'all' : statusFilter;
      const result = await api.getProducts(limit, offset, search, statusParam, categoryFilter, collectionFilter);
      setProducts(result?.data || result || []);
      setTotalPages(result?.pagination?.total_pages || 1);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, categoryFilter, collectionFilter]);

  const fetchStats = async () => {
    try {
      const data = await api.getProductStats();
      setStats(data || null);
    } catch (error) {
      console.error('Failed to load product stats:', error);
    }
  };

  useEffect(() => {
    void Promise.all([fetchProducts(), fetchStats()]);
  }, [fetchProducts]);

  const getProductPrice = (product: Product) => {
    if (Array.isArray(product.prices) && product.prices[0]?.amount) return product.prices[0].amount;
    if (Array.isArray(product.variants) && product.variants[0]?.prices?.[0]?.amount) return product.variants[0].prices[0].amount;
    if (typeof product.price === 'number') return product.price;
    if (typeof product.price === 'object' && product.price?.amount) return product.price.amount;
    return null;
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100);
  };

  const filteredProducts = products
    .filter((p) => statusFilter === 'out_of_stock' ? p.total_inventory === 0 : true)
    .sort((a, b) => {
      if (sortMode === 'stock') return b.total_inventory - a.total_inventory;
      if (sortMode === 'price') return (getProductPrice(b) || 0) - (getProductPrice(a) || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const listingCounts = {
    all: stats?.total_products || 0,
    published: stats?.published_products || 0,
    draft: stats?.draft_products || 0,
    out_of_stock: stats?.out_of_stock_products || 0,
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const nextStatus = product.status === 'published' ? 'draft' : 'published';
      await api.updateProduct(product.id, { status: nextStatus });
      await Promise.all([fetchProducts(), fetchStats()]);
    } catch (error) {
      console.error('Failed to toggle product status:', error);
      window.alert(error instanceof Error ? error.message : 'Failed to update product status');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.deleteProduct(productId);
      await Promise.all([fetchProducts(), fetchStats()]);
    } catch (error) {
      console.error('Failed to delete product:', error);
      window.alert(error instanceof Error ? error.message : 'Failed to delete product');
    }
  };


  const handleToggleVariants = async (id: string) => {
    if (expandedVariantId === id) {
      setExpandedVariantId(null);
      return;
    }
    setExpandedVariantId(id);
    if (!variantsCache[id]) {
      setIsLoadingVariants(true);
      try {
        const data = await api.getProduct(id);
        setVariantsCache(prev => ({ ...prev, [id]: data.product?.variants || data.variants || [] }));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingVariants(false);
      }
    }
  };

  const handleOpenQuickView = async (product: Product) => {
    setQuickViewProductId(product.id);
    setQuickViewProduct(null); // show loading state
    try {
      const data = await api.getProduct(product.id);
      setQuickViewProduct(data.product || data);
    } catch (e) {
      console.error(e);
      setQuickViewProductId(null);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkAction = async (action: 'status' | 'delete', status?: string) => {
    if (selectedIds.size === 0) return;
    if (action === 'delete' && !window.confirm(`Delete ${selectedIds.size} products?`)) return;
    try {
      setIsBulkActionRunning(true);
      await api.bulkProductsAction(action, Array.from(selectedIds), status);
      setSelectedIds(new Set());
      await Promise.all([fetchProducts(), fetchStats()]);
    } catch (error) {
      console.error(error);
      window.alert('Failed to perform bulk action');
    } finally {
      setIsBulkActionRunning(false);
      setActiveMenuId(null);
    }
  };
  
  const handleDuplicate = async (id: string) => {
    try {
      await api.duplicateProduct(id);
      await Promise.all([fetchProducts(), fetchStats()]);
      setActiveMenuId(null);
    } catch (error) {
      console.error(error);
      window.alert('Failed to duplicate product');
    }
  };

  /* ── Loading skeleton ── */
  if (loading && products.length === 0) {
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

  const handleInlineSave = async (id: string) => {
    try {
      await api.updateProduct(id, {
        inventory_quantity: parseInt(inlineStock, 10),
      });
      setInlineEditId(null);
      await Promise.all([fetchProducts(), fetchStats()]);
    } catch (e) {
      alert('Failed to save inline edit');
    }
  };

  const FILTER_TABS: { label: string; value: ListingFilter }[] = [
    { label: 'All',          value: 'all' },
    { label: 'Active',       value: 'published' },
    { label: 'Draft',        value: 'draft' },
    { label: 'Out of stock', value: 'out_of_stock' },
  ];

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 relative">

      {/* ── Heading ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[2.75rem] font-black leading-none tracking-tight text-[var(--on-surface)]">
            Products
          </h2>
          <p className="mt-2 text-sm font-medium text-[var(--on-surface-variant)]">
            Manage listings, drafts, stock health, and product edits.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void Promise.all([fetchProducts(), fetchStats()])}
            className="flex items-center gap-1.5 rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <Link
            href="/dashboard/products/new"
            className="flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:opacity-90 transition-opacity"
          >
            <Plus size={13} /> Add product
          </Link>
        </div>
      </section>

      {/* ── Sticky Bulk Action Bar ── */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-50 flex items-center justify-between rounded-2xl bg-[var(--surface-container-highest)] p-4 shadow-xl text-[var(--on-surface)] animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <span className="font-bold text-sm bg-[var(--primary)] text-[var(--on-primary)] px-2 py-1 rounded-md">{selectedIds.size} Selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs font-bold hover:underline">Clear</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleBulkAction('status', 'published')} disabled={isBulkActionRunning} className="rounded-full bg-[var(--surface-container-lowest)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--surface-container-low)]">
              Publish
            </button>
            <button onClick={() => handleBulkAction('status', 'draft')} disabled={isBulkActionRunning} className="rounded-full bg-[var(--surface-container-lowest)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--surface-container-low)]">
              Pause
            </button>
            <button onClick={() => handleBulkAction('delete')} disabled={isBulkActionRunning} className="rounded-full bg-[var(--error-container)] text-[var(--on-error-container)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:opacity-80">
              Delete
            </button>
          </div>
        </div>
      )}

      {/* ── Stats bento ── */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total',        value: stats?.total_products || 0 },
          { label: 'Active',       value: stats?.published_products || 0 },
          { label: 'Drafts',       value: stats?.draft_products || 0 },
          { label: 'Out of stock', value: stats?.out_of_stock_products || 0, warn: (stats?.out_of_stock_products || 0) > 0 },
        ].map((card) => (
          <div
            key={card.label}
            className={`bg-[var(--surface-container-lowest)] p-5 rounded-xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] flex flex-col gap-3 ${card.warn ? 'ring-1 ring-[var(--error)]/30' : ''}`}
          >
            <Package size={18} className="text-[var(--on-surface-variant)]" />
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">{card.label}</p>
              <p className={`text-xl font-black mt-0.5 ${card.warn ? 'text-[var(--error)]' : 'text-[var(--on-surface)]'}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Filters ── */}
      <section className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] p-4 space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                className={`rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 opacity-60">{listingCounts[tab.value]}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full bg-[var(--surface-container-low)] p-1">
            {([['grid', Grid2X2], ['list', List]] as [ViewMode, typeof Grid2X2][]).map(([mode, Icon]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  viewMode === mode
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--on-surface-variant)]'
                }`}
              >
                <Icon size={12} /> {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Search + selects */}
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" />
            <input
              type="search"
              placeholder="Search products…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] pl-10 pr-4 py-2.5 text-xs text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            />
          </div>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-2.5 text-xs text-[var(--on-surface)] focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="price">By price</option>
            <option value="stock">By stock</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-2.5 text-xs text-[var(--on-surface)] focus:outline-none"
          >
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={collectionFilter}
            onChange={(e) => { setCollectionFilter(e.target.value); setPage(1); }}
            className="rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-2.5 text-xs text-[var(--on-surface)] focus:outline-none"
          >
            <option value="all">All collections</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </section>

      {/* ── Product list ── */}
      {loading ? (
        <div className="bg-[var(--surface-container-lowest)] rounded-2xl px-4 py-12 text-center text-sm text-[var(--on-surface-variant)]">
          Loading listings…
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[var(--surface-container-lowest)] rounded-2xl px-4 py-12 text-center text-sm text-[var(--on-surface-variant)]">
          No products match the current filters.
        </div>
      ) : viewMode === 'grid' ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2 text-sm text-[var(--on-surface-variant)]">
            <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--primary)] font-bold transition-colors">
              <button type="button" onClick={handleSelectAll}>
                {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare size={16} className="text-[var(--primary)]" /> : <Square size={16} />}
              </button>
              Select All
            </label>
            <span className="font-bold text-[10px] uppercase tracking-widest">{filteredProducts.length} Products</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const price = getProductPrice(product);
            const outOfStock = product.total_inventory === 0;
            const lowStock = product.total_inventory > 0 && product.total_inventory < 5;
            const s = getStatusStyle(product.status);
            const isSelected = selectedIds.has(product.id);

            return (
              <div key={product.id} className={`bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] transition-all ${isSelected ? 'ring-2 ring-[var(--primary)]' : ''}`}>
                <div className="relative aspect-[4/3] bg-[var(--surface-container-low)] group rounded-t-2xl overflow-hidden">
                  <div className="absolute top-3 left-3 z-10">
                    <button onClick={() => handleSelect(product.id)} className="bg-white/80 backdrop-blur rounded p-1 shadow hover:bg-white transition-colors">
                      {isSelected ? <CheckSquare size={16} className="text-[var(--primary)]" /> : <Square size={16} className="text-[var(--on-surface-variant)]" />}
                    </button>
                  </div>
                  <span className={`absolute top-3 right-3 z-10 ${s.badge} px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shadow-sm`}>
                    {product.status}
                  </span>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <button onClick={() => handleOpenQuickView(product)} className="pointer-events-auto bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all">
                      <Eye size={14}/> Quick View
                    </button>
                  </div>
                  
                  {product.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={toDisplayUrl(product.thumbnail)} onClick={() => handleOpenQuickView(product)} alt={product.title} className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--on-surface-variant)]">
                      <Package size={22} />
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3 relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--on-surface)] line-clamp-2 leading-tight" title={product.title}>{product.title}</p>
                      <p className="text-sm font-black text-[var(--primary)] mt-1">{formatCurrency(price)}</p>
                    </div>
                    
                    <div className="relative">
                      <button onClick={() => setActiveMenuId(activeMenuId === product.id ? null : product.id)} className="p-1.5 rounded-full hover:bg-[var(--surface-container-low)] transition-colors">
                        <MoreVertical size={16} className="text-[var(--on-surface-variant)]" />
                      </button>
                      {activeMenuId === product.id && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-[var(--surface-container-lowest)] shadow-xl rounded-xl py-1 border border-[var(--outline-variant)] z-50">
                          <button onClick={() => { handleOpenQuickView(product); setActiveMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--surface-container-low)] w-full text-left">
                            <Eye size={12} /> Quick View
                          </button>
                          <Link href={`/dashboard/products/${product.id}`} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--surface-container-low)] w-full text-left">
                            <Edit2 size={12} /> Edit Full
                          </Link>
                          <button onClick={() => { handleToggleActive(product); setActiveMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--surface-container-low)] w-full text-left">
                            {product.status === 'published' ? <X size={12}/> : <Check size={12}/>} {product.status === 'published' ? 'Pause' : 'Activate'}
                          </button>
                          <button onClick={() => handleDuplicate(product.id)} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--surface-container-low)] w-full text-left">
                            <Copy size={12} /> Duplicate
                          </button>
                          <button onClick={() => { handleDelete(product.id); setActiveMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--error)] hover:bg-[var(--error-container)] w-full text-left">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-[var(--surface-container-low)] px-3 py-2 text-xs">
                    <span className="text-[var(--on-surface-variant)]">{product.categories?.[0]?.name || 'Uncategorized'}</span>
                    <span className={`font-bold ${outOfStock ? 'text-[var(--error)]' : lowStock ? 'text-[var(--secondary-container)]' : 'text-[var(--on-surface)]'}`}>
                      {outOfStock ? 'Out of stock' : `${product.total_inventory} in stock`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
                  </div>
        </section>
      ) : (
        /* List view */
        <section className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] divide-y divide-[var(--surface-container-low)]">
          <div className="flex items-center gap-4 p-4 font-bold text-[10px] uppercase tracking-widest text-[var(--on-surface-variant)]">
            <button onClick={handleSelectAll} className="hover:text-[var(--primary)] transition-colors">
              {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
            <div className="w-14">Image</div>
            <div className="flex-1">Product Details</div>
            <div className="hidden md:block w-24">Price</div>
            <div className="hidden md:block w-24">Stock</div>
            <div className="w-20">Status</div>
            <div className="w-12 text-right">Actions</div>
          </div>
          {filteredProducts.map((product) => {
            const price = getProductPrice(product);
            const outOfStock = product.total_inventory === 0;
            const lowStock = product.total_inventory > 0 && product.total_inventory < 5;
            const s = getStatusStyle(product.status);
            const isSelected = selectedIds.has(product.id);
            const isInlineEditing = inlineEditId === product.id;

            return (
              <div key={product.id} className={`flex flex-col border-l-4 ${s.border} ${isSelected ? 'bg-[var(--primary)]/5' : ''} hover:bg-[var(--surface-container-low)]/50 transition-colors`}>
                <div className="flex items-center gap-4 p-4">
                  <button onClick={() => handleSelect(product.id)} className="text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors">
                    {isSelected ? <CheckSquare size={16} className="text-[var(--primary)]" /> : <Square size={16} />}
                  </button>
                  
                  <div onClick={() => handleOpenQuickView(product)} className="cursor-pointer h-14 w-14 flex-shrink-0 rounded-xl overflow-hidden bg-[var(--surface-container-low)] flex items-center justify-center">
                    {product.thumbnail
                      ? <img src={toDisplayUrl(product.thumbnail)} alt={product.title} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> // eslint-disable-line @next/next/no-img-element
                      : <Package size={18} className="text-[var(--on-surface-variant)]" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p onClick={() => handleOpenQuickView(product)} className="cursor-pointer text-sm font-bold text-[var(--on-surface)] truncate hover:underline">{product.title}</p>
                    <p className="text-[10px] font-medium text-[var(--on-surface-variant)] mt-1 uppercase tracking-wide">
                      {product.categories?.[0]?.name || product.sku || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="hidden md:block w-24 text-sm font-black text-[var(--primary)]">
                    {formatCurrency(price)}
                  </div>
                  
                  <div className={`hidden md:block w-28 text-xs font-bold ${outOfStock ? 'text-[var(--error)]' : lowStock ? 'text-[var(--on-secondary-container)]' : 'text-[var(--on-surface)]'}`}>
                    {isInlineEditing ? (
                      <input 
                        type="number" 
                        value={inlineStock} 
                        onChange={e => setInlineStock(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && handleInlineSave(product.id)}
                        className="w-16 p-1 text-xs border rounded bg-white text-black" 
                        autoFocus 
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="cursor-pointer group relative inline-flex items-center gap-1" onClick={() => { 
                          if(product.variant_count <= 1) { 
                            setInlineEditId(product.id); 
                            setInlineStock(product.total_inventory.toString()); 
                          } else {
                            handleToggleVariants(product.id);
                          }
                        }}>
                          {outOfStock ? 'Out of stock' : `${product.total_inventory} in stock`}
                          {product.variant_count <= 1 && <Edit2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                        {product.variant_count > 1 && (
                          <button onClick={() => handleToggleVariants(product.id)} className="p-1 rounded hover:bg-black/10">
                            {expandedVariantId === product.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="w-20">
                    <span className={`${s.badge} px-2 py-0.5 rounded-full text-[9px] font-bold uppercase`}>{product.status}</span>
                  </div>
                  
                  <div className="w-12 text-right relative">
                    <button onClick={() => setActiveMenuId(activeMenuId === product.id ? null : product.id)} className="p-1.5 rounded-full hover:bg-[var(--surface-container-high)] transition-colors inline-flex">
                      <MoreVertical size={16} className="text-[var(--on-surface-variant)]" />
                    </button>
                    {activeMenuId === product.id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-[var(--surface-container-lowest)] shadow-xl rounded-xl py-1 border border-[var(--outline-variant)] z-20">
                        <button onClick={() => { handleOpenQuickView(product); setActiveMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--surface-container-low)] w-full text-left">
                          <Eye size={12} /> Quick View
                        </button>
                        <Link href={`/dashboard/products/${product.id}`} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--surface-container-low)] w-full text-left">
                          <Edit2 size={12} /> Edit Full
                        </Link>
                        <button onClick={() => { handleToggleActive(product); setActiveMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--surface-container-low)] w-full text-left">
                          {product.status === 'published' ? <X size={12}/> : <Check size={12}/>} {product.status === 'published' ? 'Pause' : 'Activate'}
                        </button>
                        <button onClick={() => handleDuplicate(product.id)} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--surface-container-low)] w-full text-left">
                          <Copy size={12} /> Duplicate
                        </button>
                        <button onClick={() => { handleDelete(product.id); setActiveMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--error)] hover:bg-[var(--error-container)] w-full text-left">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Variant Accordion */}
                {expandedVariantId === product.id && (
                  <div className="bg-[var(--surface-container-lowest)] px-12 py-3 text-sm animate-in slide-in-from-top-2 border-t border-[var(--outline-variant)]/50">
                    {isLoadingVariants ? (
                      <div className="text-xs text-[var(--on-surface-variant)] animate-pulse">Loading variants...</div>
                    ) : (
                      <div className="space-y-2">
                        {variantsCache[product.id]?.map(v => (
                          <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-[var(--outline-variant)]/30 last:border-0">
                            <div className="flex items-center gap-3">
                              <ChevronRight size={14} className="text-[var(--on-surface-variant)]" />
                              <span className="font-medium text-[var(--on-surface)]">{v.title}</span>
                              {v.sku && <span className="text-[10px] bg-[var(--surface-container-high)] px-1.5 py-0.5 rounded text-[var(--on-surface-variant)]">{v.sku}</span>}
                            </div>
                            <div className="flex items-center gap-6 text-xs">
                              <span className="font-bold text-[var(--primary)]">{v.prices?.[0] ? formatCurrency(v.prices[0].amount) : 'N/A'}</span>
                              <span className={`w-16 text-right font-bold ${v.inventory_quantity === 0 ? 'text-[var(--error)]' : 'text-[var(--on-surface)]'}`}>{v.inventory_quantity} in stock</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-4 py-2 font-bold text-[var(--on-surface)] disabled:opacity-40">
            Previous
          </button>
          <span className="text-[var(--on-surface-variant)]">Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
            className="rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-4 py-2 font-bold text-[var(--on-surface)] disabled:opacity-40">
            Next
          </button>
        </div>
      )}

      {/* ── Quick View Drawer ── */}
      {quickViewProductId && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in" onClick={() => setQuickViewProductId(null)} />
          <div className="relative w-full max-w-md bg-[var(--surface-container-lowest)] shadow-2xl h-full flex flex-col animate-in slide-in-from-right-full">
            <div className="flex items-center justify-between p-4 border-b border-[var(--outline-variant)]">
              <h3 className="font-black text-lg">Quick View</h3>
              <button onClick={() => setQuickViewProductId(null)} className="p-2 hover:bg-[var(--surface-container-low)] rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {!quickViewProduct ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-48 bg-[var(--surface-container-low)] rounded-xl" />
                  <div className="h-6 w-3/4 bg-[var(--surface-container-low)] rounded" />
                  <div className="h-4 w-1/4 bg-[var(--surface-container-low)] rounded" />
                </div>
              ) : (
                <div className="space-y-6">
                  {quickViewProduct.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={toDisplayUrl(quickViewProduct.thumbnail)} alt="Thumbnail" className="w-full aspect-square object-cover rounded-2xl bg-[var(--surface-container-low)]" />
                  )}
                  
                  <div>
                    <h2 className="text-2xl font-black text-[var(--on-surface)] leading-tight">{quickViewProduct.title}</h2>
                    <p className="text-sm font-bold text-[var(--primary)] mt-2">{formatCurrency(getProductPrice(quickViewProduct))}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--surface-container-low)] p-3 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-[var(--on-surface-variant)] mb-1">Status</p>
                      <p className="font-bold text-sm capitalize">{quickViewProduct.status}</p>
                    </div>
                    <div className="bg-[var(--surface-container-low)] p-3 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-[var(--on-surface-variant)] mb-1">Total Stock</p>
                      <p className="font-bold text-sm">{quickViewProduct.total_inventory}</p>
                    </div>
                  </div>
                  
                  {quickViewProduct.variants && quickViewProduct.variants.length > 0 && (
                    <div>
                      <h4 className="font-bold text-sm mb-3 border-b border-[var(--outline-variant)] pb-2">Variants</h4>
                      <div className="space-y-3">
                        {quickViewProduct.variants.map(v => (
                          <div key={v.id} className="flex justify-between items-center text-sm bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] p-3 rounded-xl shadow-sm">
                            <span className="font-medium">{v.title}</span>
                            <div className="text-right">
                              <p className="font-bold">{v.inventory_quantity} stock</p>
                              <p className="text-[10px] text-[var(--on-surface-variant)]">{v.sku || 'No SKU'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-[var(--outline-variant)] bg-[var(--surface-container-low)] flex gap-3">
              <button onClick={() => setQuickViewProductId(null)} className="flex-1 py-3 font-bold text-sm bg-[var(--surface-container-high)] rounded-xl hover:bg-[var(--outline-variant)] transition-colors">
                Close
              </button>
              {quickViewProduct && (
                <Link href={`/dashboard/products/${quickViewProduct.id}`} className="flex-1 py-3 text-center font-bold text-sm bg-[var(--primary)] text-white rounded-xl hover:opacity-90 transition-opacity">
                  Full Edit
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
