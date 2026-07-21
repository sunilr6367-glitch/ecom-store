'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import CategoryForm from '@/components/CategoryForm';
import type { Category } from '@/components/CategoryForm';

interface CategoryResponse {
  category: Category;
}

export default function EditCategoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchCategory = async () => {
      try {
        const data = (await api.getCategory(id as string)) as CategoryResponse;
        setCategory(data.category);
      } catch (err) {
        console.error(err);
        setError('Category not found or failed to load');
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [id, router]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
        Loading category...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        {error}
        <button
          onClick={() => router.push('/dashboard/categories')}
          className="block mx-auto mt-4 text-blue-600 hover:underline"
        >
          Back to Categories
        </button>
      </div>
    );
  }

  if (!category) return null;

  return (
    <div className="p-8">
      <CategoryForm initialData={category} />
    </div>
  );
}
