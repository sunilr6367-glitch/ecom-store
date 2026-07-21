'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Save,
  DollarSign,
  Plus,
  Trash2,
  Package,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import ProductMediaUpload, {
  type ProductMediaItem,
} from '@/components/ui/ProductMediaUpload';
import ProductReadinessPanel from '@/components/ProductReadinessPanel';
import { useNotification } from '@/context/notification-context';
import { getAdminProductReadinessIssues } from '@/lib/product-readiness';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import GoogleSerpPreview from '@/components/seo/GoogleSerpPreview';

interface Region {
  id: string;
  name: string;
  currency_code: string;
}

function toDisplayUrl(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  if (url.includes('/f_auto')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
}

function getCoverThumbnail(mediaItems: ProductMediaItem[]) {
  const coverItem = mediaItems.find((item) => item.is_thumbnail) || mediaItems[0];
  if (!coverItem) return '';
  if (coverItem.metadata?.media_type === 'video') {
    const firstImage = mediaItems.find((item) => item.metadata?.media_type !== 'video');
    return coverItem.metadata.thumbnail_url || toDisplayUrl(firstImage?.url || '') || toDisplayUrl(coverItem.url);
  }
  return toDisplayUrl(coverItem.url);
}

// ─── Shared input classes ─────────────────────────────────────────────────────
const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
const cardCls  = 'bg-white rounded-xl border border-gray-200 shadow-sm p-6';

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EditProductPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);

  // Data
  const [regions, setRegions]       = useState<Region[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags]             = useState<any[]>([]);

  // Selection State
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds]           = useState<string[]>([]);
  const [collections, setCollections]                 = useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');

  // Form
  const [formData, setFormData] = useState({
    title: '', subtitle: '', inventory_quantity: '', description: '',
    handle: '', status: 'draft', weight: '', length: '', height: '', width: '',
    hs_code: '', origin_country: '', material: '', thumbnail: '',
    size_guide: '', care_instructions: '', seo_title: '', seo_description: '',
  });

  const [metadata, setMetadata] = useState<any>({});
  const [faqItems, setFaqItems] = useState<{question: string, answer: string}[]>([]);
  const [seoNoIndex, setSeoNoIndex] = useState(false);
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState('');

  const [mediaItems, setMediaItems] = useState<ProductMediaItem[]>([]);
  // Single INR price — storefront converts to buyer's local currency
  const [inrPrice, setInrPrice]     = useState('');
  const [priceType, setPriceType]   = useState<'fixed' | 'on_request'>('fixed');

  // INR region needed for payload
  const inrRegion = regions.find((r) => r.currency_code.toLowerCase() === 'inr');

  // Variant State
  const [variants, setVariants]         = useState<any[]>([]);
  const [options, setOptions]           = useState<any[]>([]);
  const [showAddOption, setShowAddOption]   = useState(false);
  const [newOptionTitle, setNewOptionTitle] = useState('');
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariant, setNewVariant] = useState({
    title: '', sku: '', inventory_quantity: '0', compare_at_price: '',
  });

  const init = useCallback(async () => {
    try {
      const [regionData, productResult, catsData, tagsData, colData] = await Promise.all([
        api.getRegions(),
        api.getProduct(id),
        api.getCategories(),
        api.getTags(),
        api.getCollections(),
      ]);

      setRegions(regionData.regions || []);
      setCategories(catsData.categories || []);
      setTags(tagsData.tags || []);
      setCollections(colData.collections || []);

      const product = productResult.data?.product || productResult.product;

      if (product.categories) {
        setSelectedCategoryIds(product.categories.map((c: any) => c.category_id));
      }
      if (product.tags) {
        setSelectedTagIds(product.tags.map((t: any) => t.tag_id));
      }
      if (product.collection_id) {
        setSelectedCollectionId(product.collection_id);
      }

      setFormData({
        title:              product.title || '',
        subtitle:           product.subtitle || '',
        inventory_quantity: product.variants?.[0]?.inventory_quantity?.toString() || '',
        description:        product.description || '',
        handle:             product.handle || '',
        status:             product.status || 'draft',
        weight:             product.weight || '',
        length:             product.length || '',
        height:             product.height || '',
        width:              product.width || '',
        hs_code:            product.hs_code || '',
        origin_country:     product.origin_country || '',
        material:           product.material || '',
        thumbnail:          product.thumbnail || '',
        size_guide:         product.size_guide || '',
        care_instructions:  product.care_instructions || '',
        seo_title:          product.seo_title || '',
        seo_description:    product.seo_description || '',
      });

      setMetadata(product.metadata || {});
      setFaqItems(product.metadata?.faq_items || []);
      
      // Load SEO from API if provided in product.seo, otherwise default
      if (product.seo) {
        setSeoNoIndex(product.seo.robots_index === false);
        setSeoCanonicalUrl(product.seo.canonical_url || '');
      }

      if (product.images && product.images.length > 0) {
        setMediaItems(
          product.images
            .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
            .map((img: any) => ({
              id:           img.id,
              url:          img.url,
              is_thumbnail: img.is_thumbnail,
              alt_text:     img.alt_text || '',
              position:     img.position,
              metadata:     img.metadata || undefined,
            }))
        );
      } else if (product.thumbnail) {
        setMediaItems([{ id: 'legacy-thumb', url: product.thumbnail, is_thumbnail: true, position: 0 }]);
      }

      if (product.variants && product.variants.length > 0) {
        const variantPrices = product.variants[0].prices || [];
        // Find INR price and populate the single price field
        const inrEntry = variantPrices.find((p: any) => p.currency_code?.toLowerCase() === 'inr')
          || variantPrices[0];
        if (inrEntry) setInrPrice((inrEntry.amount / 100).toString());
      }
      if (product.price_type) {
        setPriceType(product.price_type as 'fixed' | 'on_request');
      }

      try {
        const variantData = await api.getVariants(id);
        setVariants(variantData?.variants || []);
        setOptions(variantData?.options || []);
      } catch (e) {
        console.error('Failed to load variants/options', e);
      }

    } catch (error) {
      console.error('Failed to load data', error);
      showNotification('error', 'Error loading product');
    } finally {
      setFetching(false);
    }
  }, [id, showNotification]);

  useEffect(() => { void init(); }, [init]);

  const toSlug = (text: string) =>
    text.toLowerCase().trim()
      .replaceAll(/[^\w\s-]/g, '')
      .replaceAll(/[\s_]+/g, '-')
      .replaceAll(/-+/g, '-')
      .replaceAll(/(?:^\-+|\-+$)/g, '');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'title') {
        const isAutoOrEmpty = prev.handle === '' || prev.handle === toSlug(prev.title);
        if (isAutoOrEmpty) updated.handle = toSlug(value);
      }
      return updated;
    });
  };

  const toggleCategory = (catId: string) =>
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );

  const toggleTag = (tagId: string) =>
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );

  // ── Variant Handlers ──────────────────────────────────────────────────────
  const handleAddVariant = async () => {
    if (!newVariant.title.trim()) return;
    try {
      await api.createVariant(id, {
        title:              newVariant.title,
        sku:                newVariant.sku || undefined,
        inventory_quantity: Number.parseInt(newVariant.inventory_quantity) || 0,
        compare_at_price:   newVariant.compare_at_price
          ? Math.round(Number.parseFloat(newVariant.compare_at_price) * 100)
          : undefined,
        option_values: (newVariant as any).option_values || [],
      });
      showNotification('success', `Variant "${newVariant.title}" added`);
      setNewVariant({ title: '', sku: '', inventory_quantity: '0', compare_at_price: '' });
      setShowAddVariant(false);
      const data = await api.getVariants(id);
      setVariants(data?.variants || []);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to add variant');
    }
  };

  const handleDeleteVariant = async (variantId: string, title: string) => {
    if (!confirm(`Delete size variant "${title}"?`)) return;
    try {
      await api.deleteVariant(id, variantId);
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      showNotification('success', `Variant "${title}" deleted`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete variant');
    }
  };

  const handleUpdateVariantInventory = async (variantId: string, qty: number) => {
    try {
      await api.updateVariant(id, variantId, { inventory_quantity: qty });
      setVariants((prev) =>
        prev.map((v) => v.id === variantId ? { ...v, inventory_quantity: qty } : v)
      );
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update inventory');
    }
  };

  const handleUpdateVariantCompareAtPrice = async (variantId: string, val: string) => {
    const cents = val ? Math.round(Number.parseFloat(val) * 100) : null;
    try {
      await api.updateVariant(id, variantId, { compare_at_price: cents });
      setVariants((prev) =>
        prev.map((v) => v.id === variantId ? { ...v, compare_at_price: cents } : v)
      );
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update compare price');
    }
  };

  const PRESET_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

  const handleAddPresetSize = async (size: string) => {
    if (variants.some((v) => v.title === size)) {
      showNotification('error', `Size ${size} already exists`);
      return;
    }

    let sizeOptionId = options.find((o) => o.title.toLowerCase() === 'size')?.id;
    if (!sizeOptionId) {
      try {
        const optRes = await api.createOption(id, { title: 'Size' });
        sizeOptionId = optRes.option.id;
        const data = await api.getVariants(id);
        setOptions(data?.options || []);
      } catch (e) {
        console.error('Failed to auto-create size option', e);
      }
    }

    try {
      await api.createVariant(id, {
        title:              size,
        sku:                `${formData.handle}-${size.toLowerCase()}`,
        inventory_quantity: 0,
        option_values:      sizeOptionId ? [{ option_id: sizeOptionId, value: size }] : [],
      });
      showNotification('success', `Size ${size} added`);
      const data = await api.getVariants(id);
      setVariants(data?.variants || []);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to add size');
    }
  };

  const handleCreateOption = async () => {
    if (!newOptionTitle.trim()) return;
    try {
      await api.createOption(id, { title: newOptionTitle });
      showNotification('success', `Option "${newOptionTitle}" created`);
      setNewOptionTitle('');
      setShowAddOption(false);
      const data = await api.getVariants(id);
      setOptions(data?.options || []);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create option');
    }
  };

  const readinessInput = {
    title: formData.title,
    handle: formData.handle,
    priceType,
    inrPrice,
    mediaCount: mediaItems.length,
    categoryCount: selectedCategoryIds.length,
    collectionId: selectedCollectionId,
    material: formData.material,
    seoTitle: formData.seo_title,
    seoDescription: formData.seo_description,
    mediaWithAltCount: mediaItems.filter(m => m.alt_text?.trim() !== '').length,
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.title?.trim())  throw new Error('Product title is required.');
      if (!formData.handle?.trim()) throw new Error('URL handle is required.');
      if (mediaItems.length === 0) {
        throw new Error('Add at least 1 media item before saving this product.');
      }

      const parsedInrPrice = Number.parseFloat(inrPrice);
      if (priceType === 'fixed' && (!inrPrice || Number.isNaN(parsedInrPrice) || parsedInrPrice <= 0)) {
        throw new Error('Enter a valid INR price before saving this fixed-price product.');
      }

      if (formData.status === 'published') {
        const issues = getAdminProductReadinessIssues(readinessInput);
        if (issues.length > 0) {
          throw new Error(
            `Product is not ready to publish: ${issues.map((issue) => issue.message).join(' ')}`
          );
        }
      }

      // Save price only for fixed-price products. Region is optional because storefront pricing
      // only needs currency_code + amount, and some installs may not have an INR region yet.
      const formattedPrices = priceType === 'fixed'
        ? [{
            region_id:     inrRegion?.id,
            currency_code: 'inr',
            amount:        Math.round(parsedInrPrice * 100),
          }]
        : [];

      const payload = {
        ...formData,
        price_type: priceType,
        weight:             formData.weight             ? Number.parseInt(formData.weight)             : undefined,
        length:             formData.length             ? Number.parseInt(formData.length)             : undefined,
        height:             formData.height             ? Number.parseInt(formData.height)             : undefined,
        width:              formData.width              ? Number.parseInt(formData.width)              : undefined,
        inventory_quantity: Number.parseInt(formData.inventory_quantity || '0'),
        prices:             formattedPrices,
        images:             mediaItems.map((item, idx) => ({
          url:          item.url,
          alt_text:     item.alt_text || '',
          is_thumbnail: item.is_thumbnail,
          position:     idx,
          metadata:     item.metadata ? { ...item.metadata, thumbnail_url: item.metadata.thumbnail_url || undefined } : undefined,
        })),
        thumbnail:    getCoverThumbnail(mediaItems) || undefined,
        category_ids: selectedCategoryIds,
        tag_ids:      selectedTagIds,
        collection_id: selectedCollectionId || null,
        metadata: {
          ...metadata,
          google_product_category: metadata.google_product_category || undefined,
          faq_items: faqItems,
        },
      };

      await api.updateProduct(id, payload);
      await api.updateProductSeo(id, {
        robots_index: !seoNoIndex,
        canonical_url: seoCanonicalUrl || undefined
      });
      showNotification('success', 'Product updated successfully');
      router.push('/dashboard/products');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 text-center">Loading...</div>;


  return (
    <div className="space-y-6 px-4 pb-16 md:px-8">

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 pt-2 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/products"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--kv-border)] bg-white text-[var(--kv-muted)] transition hover:text-[var(--kv-text)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--kv-accent-deep)]">
              Listing editor
            </p>
            <h1 className="mt-1 font-[var(--font-display)] text-[2.2rem] leading-none text-[var(--kv-text)]">
              Edit Product
            </h1>
            <p className="mt-1.5 text-sm text-[var(--kv-muted)]">{formData.title}</p>
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl border border-[var(--kv-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--kv-text)] hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-[var(--kv-text)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition"
          >
            <Save size={16} />
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">

        {/* ════════════════════════════════════════
            LEFT COLUMN — main content, scrollable
            ════════════════════════════════════════ */}
        <div className="space-y-6 min-w-0">

          {/* 1 ── Media Upload (TOP) */}
          <div className={cardCls}>
            <h2 className="text-base font-bold text-gray-800 mb-1">Product Media</h2>
            <p className="text-sm text-gray-500 mb-5">
              Keep the gallery in the same order customers should swipe through it.
              Portrait images (4:5) work best on mobile.
            </p>
            <ProductMediaUpload
              items={mediaItems}
              onChange={setMediaItems}
              onError={(msg) => showNotification('error', msg)}
            />
          </div>

          {/* 2 ── Basic Information */}
          <div className={cardCls}>
            <h2 className="text-base font-bold text-gray-800 mb-5">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className={labelCls}>
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title" type="text" name="title"
                  value={formData.title} onChange={handleChange} required
                  className={inputCls} placeholder="e.g. Summer Linen Shirt"
                />
              </div>
              <div>
                <label htmlFor="subtitle" className={labelCls}>Subtitle</label>
                <input
                  id="subtitle" type="text" name="subtitle"
                  value={formData.subtitle} onChange={handleChange}
                  className={inputCls} placeholder="e.g. Lightweight and breathable"
                />
              </div>
            </div>
          </div>

          {/* 3 ── Details */}
          <div className={cardCls}>
            <h2 className="text-base font-bold text-gray-800 mb-5">Details</h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="description" className={labelCls}>Description</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(val) => setFormData(p => ({ ...p, description: val }))}
                  placeholder="Detailed product description…"
                />
              </div>
              <div>
                <label htmlFor="size_guide" className={labelCls}>Size Guide</label>
                <RichTextEditor
                  value={formData.size_guide || ''}
                  onChange={(val) => setFormData(p => ({ ...p, size_guide: val }))}
                  placeholder="e.g. Model is 5'9 and wearing size M. Fits true to size."
                />
              </div>
              <div>
                <label htmlFor="care_instructions" className={labelCls}>Care Instructions</label>
                <RichTextEditor
                  value={formData.care_instructions || ''}
                  onChange={(val) => setFormData(p => ({ ...p, care_instructions: val }))}
                  placeholder="e.g. Machine wash cold, dry flat."
                />
              </div>
            </div>
          </div>

          {/* 4 ── Pricing */}
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-green-600" />
              <h2 className="text-base font-bold text-gray-800">Price</h2>
            </div>
            <div className="flex gap-3 mb-5">
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${priceType === 'fixed' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <input type="radio" name="price_type" value="fixed" checked={priceType === 'fixed'} onChange={() => setPriceType('fixed')} className="sr-only" />
                Fixed Price
              </label>
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${priceType === 'on_request' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <input type="radio" name="price_type" value="on_request" checked={priceType === 'on_request'} onChange={() => setPriceType('on_request')} className="sr-only" />
                On Request (WhatsApp)
              </label>
            </div>
            {priceType === 'on_request' ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                Customer will see a WhatsApp enquiry button instead of &ldquo;Add to Bag&rdquo;.
                {inrPrice && <span className="ml-1 font-medium">Note: Saving will remove the current price.</span>}
              </div>
            ) : (
              <div className="max-w-xs">
                <label htmlFor="inr_price" className={labelCls}>
                  Price (INR ₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
                  <input
                    id="inr_price" type="number" min="0" step="1"
                    value={inrPrice}
                    onChange={(e) => setInrPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                    placeholder="e.g. 1999"
                  />
                </div>
                {inrPrice && (
                  <p className="mt-2 text-xs text-gray-500">
                    ≈ ${(Number(inrPrice) * 0.012).toFixed(2)} USD &nbsp;·&nbsp;
                    €{(Number(inrPrice) * 0.011).toFixed(2)} EUR
                    <span className="ml-1 text-gray-400">(indicative)</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 5 ── Inventory */}
          <div className={cardCls}>
            <h2 className="text-base font-bold text-gray-800 mb-5">Inventory</h2>
            <div>
              <label htmlFor="inventory_quantity" className={labelCls}>
                Quantity in Stock
              </label>
              <input
                id="inventory_quantity" type="number" name="inventory_quantity"
                value={formData.inventory_quantity} onChange={handleChange}
                className={`${inputCls} max-w-xs`} placeholder="e.g. 100"
              />
            </div>
          </div>

          {/* 6 ── Size Variants */}
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-purple-600" />
                <h2 className="text-base font-bold text-gray-800">Size Variants</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVariant(!showAddVariant)}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <Plus size={15} />
                Add Size
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Add size variants for this product. Each size can have its own inventory count and SKU.
            </p>

            {/* Quick Add Preset Sizes */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Quick Add Sizes:
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SIZES.map((size) => {
                  const exists = variants.some((v) => v.title === size);
                  return (
                    <button
                      key={size} type="button"
                      onClick={() => !exists && handleAddPresetSize(size)}
                      disabled={exists}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        exists
                          ? 'bg-green-50 text-green-700 border-green-200 cursor-default'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                      }`}
                    >
                      {exists ? `✓ ${size}` : `+ ${size}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Options Management */}
            <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Product Options</h3>
                <button
                  type="button"
                  onClick={() => setShowAddOption(!showAddOption)}
                  className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Option
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {options.map((opt) => (
                  <span
                    key={opt.id}
                    className="inline-flex items-center px-2.5 py-1 rounded bg-white border border-gray-300 text-sm font-medium text-gray-700"
                  >
                    {opt.title}
                  </span>
                ))}
                {options.length === 0 && (
                  <span className="text-xs text-gray-500 italic">
                    No options defined (e.g. Size, Color)
                  </span>
                )}
              </div>

              {showAddOption && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text" value={newOptionTitle}
                    onChange={(e) => setNewOptionTitle(e.target.value)}
                    placeholder="e.g. Color"
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none flex-1"
                  />
                  <button
                    type="button" onClick={handleCreateOption}
                    className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900"
                  >
                    Save Option
                  </button>
                </div>
              )}
            </div>

            {/* Add Custom Variant Form */}
            {showAddVariant && (
              <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="text-sm font-semibold text-purple-800 mb-3">Add Custom Variant</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {options.map((opt) => (
                    <div key={opt.id}>
                      <label htmlFor={`opt-${opt.id}`} className="block text-xs text-gray-600 mb-1">
                        {opt.title}
                      </label>
                      <input
                        id={`opt-${opt.id}`} type="text"
                        placeholder={`e.g. ${opt.title === 'Size' ? 'XL' : opt.title === 'Color' ? 'Red' : 'Value'}`}
                        onChange={(e) => {
                          const currentValues = (newVariant as any).option_values || [];
                          const existing = currentValues.findIndex((v: any) => v.option_id === opt.id);
                          if (existing >= 0) currentValues[existing].value = e.target.value;
                          else currentValues.push({ option_id: opt.id, value: e.target.value });
                          setNewVariant((p) => ({ ...p, option_values: currentValues }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label htmlFor="new_variant_title" className="block text-xs text-gray-600 mb-1">
                      Variant Title *
                    </label>
                    <input
                      id="new_variant_title" type="text" value={newVariant.title}
                      onChange={(e) => setNewVariant((p) => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      placeholder="e.g. Free Size"
                    />
                  </div>
                  <div>
                    <label htmlFor="new_variant_sku" className="block text-xs text-gray-600 mb-1">SKU</label>
                    <input
                      id="new_variant_sku" type="text" value={newVariant.sku}
                      onChange={(e) => setNewVariant((p) => ({ ...p, sku: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div>
                    <label htmlFor="new_variant_inventory" className="block text-xs text-gray-600 mb-1">
                      Inventory
                    </label>
                    <input
                      id="new_variant_inventory" type="number" value={newVariant.inventory_quantity}
                      onChange={(e) => setNewVariant((p) => ({ ...p, inventory_quantity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="new_variant_compare_price" className="block text-xs text-gray-600 mb-1">
                      Compare Price
                    </label>
                    <input
                      id="new_variant_compare_price" type="number" value={newVariant.compare_at_price}
                      onChange={(e) => setNewVariant((p) => ({ ...p, compare_at_price: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button" onClick={handleAddVariant}
                    className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                  >
                    Add Variant
                  </button>
                  <button
                    type="button" onClick={() => setShowAddVariant(false)}
                    className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Variants Table */}
            {variants.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Inventory</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Compare at Price</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {variants.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                            {v.title}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{v.sku || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number" value={v.inventory_quantity ?? 0}
                            onChange={(e) => handleUpdateVariantInventory(v.id, Number.parseInt(e.target.value) || 0)}
                            className="w-20 text-center px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="relative inline-block">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input
                              type="number"
                              value={v.compare_at_price ? v.compare_at_price / 100 : ''}
                              onChange={(e) => handleUpdateVariantCompareAtPrice(v.id, e.target.value)}
                              placeholder="0.00"
                              className="w-24 pl-5 pr-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(v.id, v.title)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Delete variant"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 border border-dashed border-gray-300 rounded-lg">
                <Package size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No size variants yet</p>
                <p className="text-xs text-gray-400 mt-1">Use the quick-add buttons above to add standard sizes</p>
              </div>
            )}
          </div>

          {/* 7 ── Shipping & Dimensions */}
          <div className={cardCls}>
            <h2 className="text-base font-bold text-gray-800 mb-5">Shipping & Dimensions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {[
                { id: 'weight', label: 'Weight (g)' },
                { id: 'length', label: 'Length (cm)' },
                { id: 'width',  label: 'Width (cm)' },
                { id: 'height', label: 'Height (cm)' },
              ].map(({ id: fid, label }) => (
                <div key={fid}>
                  <label htmlFor={fid} className="block text-xs font-medium text-gray-500 mb-1">
                    {label}
                  </label>
                  <input
                    id={fid} type="number" name={fid}
                    value={(formData as any)[fid]} onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="hs_code" className={labelCls}>HS Code</label>
                <input id="hs_code" type="text" name="hs_code"
                  value={formData.hs_code} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label htmlFor="origin_country" className={labelCls}>Origin Country</label>
                <input id="origin_country" type="text" name="origin_country"
                  value={formData.origin_country} onChange={handleChange}
                  className={inputCls} placeholder="IN" />
              </div>
              <div>
                <label htmlFor="material" className={labelCls}>Material</label>
                <input id="material" type="text" name="material"
                  value={formData.material} onChange={handleChange} className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            RIGHT COLUMN — sticky sidebar
            ════════════════════════════════════════ */}
        <div className="space-y-5 lg:sticky lg:top-6">

          <ProductReadinessPanel input={readinessInput} />

          {/* 2 ── Organisation */}
          <div className={cardCls}>
            <h2 className="text-base font-bold text-gray-800 mb-4">Organisation</h2>
            <div className="space-y-4">

              <div>
                <label htmlFor="status" className={labelCls}>Status</label>
                <select
                  id="status" name="status" value={formData.status} onChange={handleChange}
                  className={inputCls}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="proposed">Proposed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label htmlFor="collection" className={labelCls}>Collection</label>
                <select
                  id="collection" value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">No Collection</option>
                  {collections.map((col: any) => (
                    <option key={col.id} value={col.id}>{col.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="handle" className={labelCls}>
                  URL Handle <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                  <span className="inline-flex items-center px-3 bg-gray-50 text-gray-400 text-xs border-r border-gray-200 whitespace-nowrap">
                    /products/
                  </span>
                  <input
                    id="handle" type="text" name="handle"
                    value={formData.handle} onChange={handleChange} required
                    className="flex-1 px-3 py-2 outline-none text-sm bg-white"
                    placeholder="url-handle"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3 ── Categorization */}
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-4">
              <Tag size={15} className="text-gray-400" />
              <h2 className="text-base font-bold text-gray-800">Categorization</h2>
            </div>

            <div className="mb-5">
              <label className={labelCls}>Categories</label>
              <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-400">No categories found.</p>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <input
                        type="checkbox" id={`cat-${cat.id}`}
                        checked={selectedCategoryIds.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      <label htmlFor={`cat-${cat.id}`}
                        className="text-sm text-gray-700 cursor-pointer select-none">
                        {cat.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className={labelCls}>Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-gray-400">No tags found.</p>
                ) : (
                  tags.map((tag) => (
                    <button
                      key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        selectedTagIds.includes(tag.id)
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 4 ── SEO */}
          <div className={cardCls}>
            <h2 className="text-base font-bold text-gray-800 mb-4">
              Search Engine Optimisation
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="seo_title" className={labelCls}>Page Title</label>
                <input
                  id="seo_title" type="text" name="seo_title"
                  value={formData.seo_title || ''} onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g. Elegant Summer Linen Shirt | Odhvica"
                />
              </div>
              <div>
                <label htmlFor="seo_description" className={labelCls}>Meta Description</label>
                <textarea
                  id="seo_description" name="seo_description"
                  value={formData.seo_description || ''} onChange={handleChange} rows={3}
                  className={inputCls}
                  placeholder="Compelling summary for search results…"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Recommended: 150–160 characters
                </p>
              </div>

              <GoogleSerpPreview 
                title={formData.seo_title || formData.title} 
                description={formData.seo_description || 'Compelling summary for search results…'} 
                url={formData.handle} 
              />
              
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Advanced Technical SEO</h3>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="flex items-center h-5">
                      <input 
                        type="checkbox" 
                        checked={seoNoIndex} 
                        onChange={(e) => setSeoNoIndex(e.target.checked)} 
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Hide from search engines (noindex)</span>
                      <p className="text-xs text-gray-500">Prevent Google from indexing this product page.</p>
                    </div>
                  </label>
                  
                  <div>
                    <label htmlFor="canonical_url" className={labelCls}>Custom Canonical URL</label>
                    <input
                      id="canonical_url" type="url"
                      value={seoCanonicalUrl}
                      onChange={(e) => setSeoCanonicalUrl(e.target.value)}
                      className={inputCls}
                      placeholder="e.g. https://odhvica.com/products/original-shirt"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank to auto-generate.</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="google_category" className={labelCls}>Google Product Category</label>
                <input
                  id="google_category" type="text"
                  value={metadata.google_product_category || ''}
                  onChange={(e) => setMetadata((p: any) => ({ ...p, google_product_category: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. Apparel & Accessories > Clothing"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={labelCls} style={{ marginBottom: 0 }}>Product FAQs (SEO)</label>
                  <button type="button" onClick={() => setFaqItems(p => [...p, { question: '', answer: '' }])} className="text-xs text-blue-600 hover:underline flex items-center"><Plus size={12} className="mr-1"/> Add FAQ</button>
                </div>
                {faqItems.map((faq, idx) => (
                  <div key={idx} className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50 relative">
                    <button type="button" onClick={() => setFaqItems(p => p.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                    <input type="text" value={faq.question} onChange={e => {
                      const newFaqs = [...faqItems];
                      newFaqs[idx].question = e.target.value;
                      setFaqItems(newFaqs);
                    }} placeholder="Question?" className="w-full mb-2 px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-black" />
                    <textarea value={faq.answer} onChange={e => {
                      const newFaqs = [...faqItems];
                      newFaqs[idx].answer = e.target.value;
                      setFaqItems(newFaqs);
                    }} placeholder="Answer..." rows={2} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-black"></textarea>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
        {/* end right column */}
      </div>
    </div>
  );
}
