'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Folder } from 'lucide-react';
import ImageUploadField from '@/components/ui/ImageUploadField';
import ProductAssignmentPicker, {
  type AssignedProduct,
} from '@/components/ProductAssignmentPicker';

interface Collection {
  id: string;
  title: string;
  handle: string;
  image?: string;
  cover_image_url?: string;
  type?: string;
  status?: string;
  description?: string;
  show_in_megamenu?: boolean;
  homepage_section?: string;
  seo_title?: string;
  seo_desc?: string;
  is_indexable?: boolean;
  robots_policy?: string;
  canonical_url?: string | null;
  seasonal_flag?: 'evergreen' | 'seasonal' | 'campaign' | string;
  faq_items?: Array<{ question: string; answer: string }>;
  answer_capsule?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const emptyCollectionForm = {
  title: '',
  handle: '',
  image: '',
  type: '',
  status: 'draft' as string,
  description: '',
  show_in_megamenu: false,
  homepage_section: '',
  seo_title: '',
  seo_desc: '',
  is_indexable: true,
  robots_policy: 'index,follow',
  canonical_url: '',
  seasonal_flag: 'evergreen',
  answer_capsule: '',
  faq_question_1: '',
  faq_answer_1: '',
  faq_question_2: '',
  faq_answer_2: '',
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<AssignedProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(true);
  const [formData, setFormData] = useState(emptyCollectionForm);

  const fetchCollections = async () => {
    try {
      const data = await api.getCollections();
      setCollections(data?.collections || []);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId && !productsLoaded) {
        alert('Assigned products are still loading or failed to load. Reload this page before saving.');
        return;
      }

      let collectionId = editingId;
      const payload = {
        ...formData,
        faq_items: [
          formData.faq_question_1 && formData.faq_answer_1
            ? { question: formData.faq_question_1, answer: formData.faq_answer_1 }
            : null,
          formData.faq_question_2 && formData.faq_answer_2
            ? { question: formData.faq_question_2, answer: formData.faq_answer_2 }
            : null,
        ].filter(Boolean),
        canonical_url: formData.canonical_url || null,
        answer_capsule: formData.answer_capsule || null,
        seasonal_flag: formData.seasonal_flag || (formData.type === 'seasonal' ? 'seasonal' : 'evergreen'),
      };

      if (editingId) {
        if (formData.status === 'active') {
          await api.updateCollectionProducts(
            editingId,
            selectedProducts.map((product) => product.id)
          );
        }
        await api.updateCollection(editingId, payload);
      } else {
        const response = await api.createCollection(payload);
        collectionId = response.collection?.id;
      }

      if (collectionId && !(editingId && formData.status === 'active')) {
        await api.updateCollectionProducts(
          collectionId,
          selectedProducts.map((product) => product.id)
        );
      }
      setFormData(emptyCollectionForm);
      setSelectedProducts([]);
      setProductsLoaded(true);
      setShowForm(false);
      setEditingId(null);
      void fetchCollections().catch((refreshError) => {
        console.warn('Saved collection, but refresh failed:', refreshError);
        alert('Saved collection, but the list could not refresh. Reload the page to see the update.');
      });
    } catch (error) {
      console.error('Failed to save collection:', error);
      alert(error instanceof Error ? error.message : 'Failed to save collection');
    }
  };

  const handleEdit = async (collection: Collection) => {
    const faqItems = collection.faq_items || [];
    setFormData({
      title: collection.title,
      handle: collection.handle,
      image: collection.cover_image_url || collection.image || '',
      type: collection.type || '',
      status: collection.status || 'draft',
      description: collection.description || '',
      show_in_megamenu: collection.show_in_megamenu || false,
      homepage_section: collection.homepage_section || '',
      seo_title: collection.seo_title || '',
      seo_desc: collection.seo_desc || '',
      is_indexable: collection.is_indexable !== false,
      robots_policy: collection.robots_policy || 'index,follow',
      canonical_url: collection.canonical_url || '',
      seasonal_flag: collection.seasonal_flag || (collection.type === 'seasonal' ? 'seasonal' : 'evergreen'),
      answer_capsule: collection.answer_capsule || '',
      faq_question_1: faqItems[0]?.question || '',
      faq_answer_1: faqItems[0]?.answer || '',
      faq_question_2: faqItems[1]?.question || '',
      faq_answer_2: faqItems[1]?.answer || '',
    });
    setEditingId(collection.id);
    setProductsLoaded(false);
    try {
      const response = await api.getCollectionProducts(collection.id);
      setSelectedProducts(response.products || []);
      setProductsLoaded(true);
    } catch (error) {
      console.error('Failed to load collection products:', error);
      setSelectedProducts([]);
      setProductsLoaded(false);
      alert('Failed to load assigned products. Reload before saving this collection.');
    }
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    try {
      await api.deleteCollection(id);
      fetchCollections();
    } catch (error) {
      console.error('Failed to delete collection:', error);
      alert('Failed to delete collection');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
        Loading collections...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-500 mt-1">Manage product collections</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData(emptyCollectionForm);
            setSelectedProducts([]);
            setProductsLoaded(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          Add Collection
        </button>
      </div>

      {/* Clarification Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-amber-900">
          <strong>What are Collections?</strong> Collections are editorial or seasonal groupings of products created for marketing campaigns and storytelling. They don&apos;t affect navigation but help you organize and promote curated product selections.
        </p>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {editingId ? 'Edit Collection' : 'Create Collection'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="e.g. Summer Collection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Handle
                </label>
                <input
                  type="text"
                  value={formData.handle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      handle: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="e.g. summer-collection"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="">Select type</option>
                  <option value="occasion">Occasion</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="price">Price</option>
                  <option value="fabric">Fabric</option>
                  <option value="gift">Gift</option>
                  <option value="style">Style</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="draft">🟡 Draft</option>
                  <option value="active">🟢 Active</option>
                  <option value="archived">⚫ Archived</option>
                </select>
                {formData.status === 'active' && (
                  <p className="text-xs text-amber-600 mt-1">Active requires 3+ products and a cover image.</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                placeholder="Short description of this collection..."
              />
            </div>
            <ImageUploadField
              label="Cover Image"
              value={formData.image}
              onChange={(image) => setFormData({ ...formData, image })}
              helpText="Upload the collection cover image instead of pasting a URL."
              uploadButtonText="Upload collection image"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Homepage Section</label>
                <select
                  value={formData.homepage_section}
                  onChange={(e) => setFormData({ ...formData, homepage_section: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="">None</option>
                  <option value="collections">Collections (Homepage Grid)</option>
                  <option value="collection_slider">Collection Slider</option>
                  <option value="shop_by_occasion">Shop by Occasion</option>
                  <option value="seasonal_edits">Seasonal Edits</option>
                  <option value="shop_by_fabric">Shop by Fabric</option>
                  <option value="curated_collections">Curated Collections</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="show_in_megamenu"
                  checked={formData.show_in_megamenu}
                  onChange={(e) => setFormData({ ...formData, show_in_megamenu: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="show_in_megamenu" className="text-sm font-medium text-gray-700">Show in Mega Menu</label>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={Boolean(editingId) && !productsLoaded}
                className="px-4 py-2 bg-black text-white rounded-lg transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData(emptyCollectionForm);
                  setSelectedProducts([]);
                  setProductsLoaded(true);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
            <ProductAssignmentPicker
              selectedProducts={selectedProducts}
              onChange={setSelectedProducts}
              label="Products in this Collection"
              helpText="Select products that should appear on this collection storefront page."
            />
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="flex-1">Name</div>
          <div className="w-40">Handle</div>
          <div className="w-20 text-center">Actions</div>
        </div>

        {collections.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Folder size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">
              No collections found
            </p>
            <p className="mt-1 mb-6">
              Get started by creating your first collection.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              <Plus size={18} />
              Create Collection
            </button>
          </div>
        ) : (
          collections.map((collection) => (
            <div
              key={collection.id}
              className="flex items-center border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-0"
            >
              <div className="flex-1 py-3 px-4 flex items-center gap-3">
                <Folder size={16} className="text-gray-400 shrink-0" />
                <span className="font-medium text-gray-900">{collection.title}</span>
                {collection.status && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${collection.status === 'active' ? 'bg-green-100 text-green-700' : collection.status === 'archived' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>
                    {collection.status}
                  </span>
                )}
                {collection.type && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{collection.type}</span>
                )}
                {collection.is_indexable === false && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-medium">noindex</span>
                )}
                {collection.seasonal_flag && collection.seasonal_flag !== 'evergreen' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">{collection.seasonal_flag}</span>
                )}
              </div>
              <div className="w-40 py-3 px-4 text-sm text-gray-500">
                /collections/{collection.handle}
              </div>
              <div className="w-20 py-3 px-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleEdit(collection)}
                  aria-label={`Edit collection ${collection.title}`}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(collection.id)}
                  aria-label={`Delete collection ${collection.title}`}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
