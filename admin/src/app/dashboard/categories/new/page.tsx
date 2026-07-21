'use client';

import CategoryForm from '@/components/CategoryForm';

export default function NewCategoryPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Create New Category</h1>
      <CategoryForm />
    </div>
  );
}
