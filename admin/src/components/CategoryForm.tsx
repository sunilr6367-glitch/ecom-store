'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import ImageUploadField from '@/components/ui/ImageUploadField';
import ProductAssignmentPicker, {
  type AssignedProduct,
} from '@/components/ProductAssignmentPicker';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image?: string;
  is_active?: boolean;
  seo_title?: string;
  seo_desc?: string;
  og_image_url?: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parent_id: string;
  image: string;
  is_active: boolean;
  emoji: string;
  display_order: number;
  show_in_header: boolean;
  header_image_url: string;
  seo_title: string;
  seo_desc: string;
  og_image_url: string;
}

type CategoryPayload = Omit<
  CategoryFormData,
  'parent_id' | 'emoji' | 'header_image_url' | 'og_image_url'
> & {
  parent_id: string | null;
  emoji: string | null;
  header_image_url: string | null;
  og_image_url: string | null;
};

interface CategoryFormProps {
  initialData?: Category & Partial<CategoryFormData>;
}

interface CategoriesResponse {
  categories: Category[];
}

const createInitialFormData = (
  initialData?: Category & Partial<CategoryFormData>
): CategoryFormData => ({
  name: initialData?.name || '',
  slug: initialData?.slug || '',
  description: initialData?.description || '',
  parent_id: initialData?.parent_id || '',
  image: initialData?.image || '',
  is_active: initialData?.is_active ?? true,
  emoji: initialData?.emoji || '',
  display_order: initialData?.display_order ?? 0,
  show_in_header: initialData?.show_in_header ?? true,
  header_image_url: initialData?.header_image_url || '',
  seo_title: initialData?.seo_title || '',
  seo_desc: initialData?.seo_desc || '',
  og_image_url: initialData?.og_image_url || '',
});

export default function CategoryForm({ initialData }: CategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<AssignedProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(!initialData?.id);
  const [formData, setFormData] = useState<CategoryFormData>(
    createInitialFormData(initialData)
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = (await api.getCategories()) as CategoriesResponse;
        const filtered = initialData
          ? data.categories.filter((c) => c.id !== initialData.id)
          : data.categories;
        setCategories(filtered);
      } catch (err) {
        console.error('Failed to fetch categories for parent select', err);
      }
    };

    void fetchCategories();
  }, [initialData]);

  useEffect(() => {
    if (!initialData?.id) {
      setProductsLoaded(true);
      return;
    }

    const fetchAssignedProducts = async () => {
      try {
        setProductsLoaded(false);
        const data = await api.getCategoryProducts(initialData.id);
        setSelectedProducts(data.products || []);
        setProductsLoaded(true);
      } catch (err) {
        console.error('Failed to fetch assigned category products', err);
        setProductsLoaded(false);
        setError('Failed to load assigned products. Reload before saving this category.');
      }
    };

    void fetchAssignedProducts();
  }, [initialData?.id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: name === 'display_order' ? Number(value) || 0 : value,
      } as CategoryFormData;

      if (name === 'name' && !initialData) {
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }

      return next;
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (initialData?.id && !productsLoaded) {
        setError('Assigned products are still loading or failed to load. Reload this page before saving.');
        return;
      }

      const payload: CategoryPayload = {
        ...formData,
        parent_id: formData.parent_id === '' ? null : formData.parent_id,
        emoji: formData.emoji === '' ? null : formData.emoji,
        header_image_url:
          formData.header_image_url === '' ? null : formData.header_image_url,
        og_image_url: formData.og_image_url === '' ? null : formData.og_image_url,
      };

      let categoryId = initialData?.id;

      if (initialData) {
        await api.updateCategory(initialData.id, payload);
      } else {
        const response = await api.createCategory(payload);
        categoryId = response.category?.id;
      }

      if (categoryId) {
        await api.updateCategoryProducts(
          categoryId,
          selectedProducts.map((product) => product.id)
        );
      }

      router.push('/dashboard/categories');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/dashboard/categories"
          className="flex items-center text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Categories
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {initialData ? 'Edit Category' : 'New Category'}
        </h1>
      </div>

      {error && (
        <div className="mb-6 flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none transition-all focus:border-black focus:ring-2 focus:ring-black"
              placeholder="e.g. Summer Collection"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Slug
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              readOnly={Boolean(initialData?.id && selectedProducts.length > 0)}
              className={`w-full rounded-lg border px-4 py-2 text-gray-600 outline-none transition-all focus:border-black focus:ring-2 focus:ring-black ${initialData?.id && selectedProducts.length > 0 ? 'border-amber-300 bg-amber-50 cursor-not-allowed' : 'border-gray-300 bg-gray-50'}`}
              required
            />
            {initialData?.id && selectedProducts.length > 0 && (
              <p className="text-xs text-amber-700">
                Slug locked — {selectedProducts.length} product(s) use this URL. Contact a super_admin to change it.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Parent Category
          </label>
          <select
            name="parent_id"
            value={formData.parent_id}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none transition-all focus:border-black focus:ring-2 focus:ring-black"
          >
            <option value="">None (Top Level)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 outline-none transition-all focus:border-black focus:ring-2 focus:ring-black"
            placeholder="Describe this category..."
          />
        </div>

        <ImageUploadField
          label="Image"
          value={formData.image}
          onChange={(image) => setFormData((prev) => ({ ...prev, image }))}
          helpText="Upload the category image instead of pasting a URL."
          uploadButtonText="Upload category image"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Emoji (Optional)
          </label>
          <input
            type="text"
            name="emoji"
            value={formData.emoji}
            onChange={handleChange}
            maxLength={2}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none transition-all focus:border-black focus:ring-2 focus:ring-black"
            placeholder="e.g. bed"
          />
          <p className="text-xs text-gray-500">
            Copy-paste emoji from{' '}
            <a
              href="https://emojipedia.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Emojipedia
            </a>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Display Order
            </label>
            <input
              type="number"
              name="display_order"
              value={formData.display_order}
              onChange={handleChange}
              min="0"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none transition-all focus:border-black focus:ring-2 focus:ring-black"
              placeholder="0"
            />
            <p className="text-xs text-gray-500">
              Lower values appear first in the header
            </p>
          </div>
        </div>

        <ImageUploadField
          label="Header Image"
          value={formData.header_image_url}
          onChange={(header_image_url) =>
            setFormData((prev) => ({ ...prev, header_image_url }))
          }
          helpText="Shows in the storefront mega menu dropdown."
          uploadButtonText="Upload header image"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show_in_header"
            name="show_in_header"
            checked={formData.show_in_header}
            onChange={handleCheckboxChange}
            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
          />
          <label
            htmlFor="show_in_header"
            className="cursor-pointer text-sm font-medium text-gray-700"
          >
            Show in Header Navigation?
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleCheckboxChange}
            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
          />
          <label
            htmlFor="is_active"
            className="cursor-pointer text-sm font-medium text-gray-700"
          >
            Visible on Storefront?
          </label>
        </div>

      </div>

      <ProductAssignmentPicker
        selectedProducts={selectedProducts}
        onChange={setSelectedProducts}
        label="Products in this Category"
        helpText="Select products that should appear on this category storefront page."
      />


      <div className="flex justify-end rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <button
          type="submit"
          disabled={loading || (Boolean(initialData?.id) && !productsLoaded)}
          className="flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            'Saving...'
          ) : (
            <>
              <Save size={18} />
              Save Category
            </>
          )}
        </button>
      </div>
    </form>
  );
}
