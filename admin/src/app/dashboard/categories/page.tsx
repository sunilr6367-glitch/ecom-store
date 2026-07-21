'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: string;
  children?: Category[];
  is_active?: boolean;
  emoji?: string;
  display_order?: number;
  show_in_header?: boolean;
  _count?: {
    products: number;
  };
}

function CategoryItem({
  category,
  depth = 0,
  onDelete,
}: {
  category: Category;
  depth?: number;
  onDelete: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <>
      <div className="flex items-center border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-0">
        <div
          className="flex-1 py-3 px-4 flex items-center"
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${category.name}`}
              className="mr-2 text-gray-500 hover:text-gray-700"
            >
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div className="w-6 mr-2" /> // spacer
          )}

          {category.image ? (
            <img
              src={category.image}
              alt={category.name}
              className="w-10 h-10 object-cover rounded mr-3"
            />
          ) : (
            <span className="mr-2 text-gray-400">
              {hasChildren ? (
                isOpen ? (
                  <FolderOpen size={16} />
                ) : (
                  <Folder size={16} />
                )
              ) : (
                <div className="w-4" />
              )}
            </span>
          )}

          {category.emoji && (
            <span className="text-lg mr-2">{category.emoji}</span>
          )}

          <span className="font-medium text-gray-900">{category.name}</span>
          
          {category.display_order !== undefined && category.display_order !== 0 && (
            <span className="ml-2 text-xs text-gray-500">
              (order: {category.display_order})
            </span>
          )}
          
          <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {category.slug}
          </span>

          {category.show_in_header && (
            <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              IN HEADER
            </span>
          )}

          {!category.is_active && (
            <span className="ml-2 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              Hidden
            </span>
          )}
        </div>

        <div className="py-3 px-4 flex items-center gap-2">
          <Link
            href={`/dashboard/categories/${category.id}`}
            aria-label={`Edit category ${category.name}`}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </Link>
          <button
            type="button"
            onClick={() => onDelete(category.id)}
            aria-label={`Delete category ${category.name}`}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isOpen &&
        hasChildren &&
        category.children!.map((child) => (
          <CategoryItem
            key={child.id}
            category={child}
            depth={depth + 1}
            onDelete={onDelete}
          />
        ))}
    </>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      setError('');
      const data = await api.getCategoriesTree();
      setCategories(data?.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Unable to load the category list right now. New categories can still be created, but the page needs a working refresh to show them.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await api.deleteCategory(id);
      fetchCategories(); // Refresh list
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
        Loading categories...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">
            Manage product categories and hierarchy
          </p>
        </div>
        <Link
          href="/dashboard/categories/new"
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          Add Category
        </Link>
      </div>

      {/* Clarification Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          <strong>What are Categories?</strong> Categories form the product taxonomy and appear in the storefront header navigation. Customers use them to browse by product type. Use emojis and header images to make them visually appealing.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="flex-1">Name</div>
          <div className="w-20 text-center">Actions</div>
        </div>

        {categories.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FolderOpen size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">
              No categories found
            </p>
            <p className="mt-1 mb-6">
              Get started by creating your first category.
            </p>
            <Link
              href="/dashboard/categories/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              <Plus size={18} />
              Create Category
            </Link>
          </div>
        ) : (
          <div>
            {categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
