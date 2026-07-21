'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Edit2, Eye, EyeOff, Save, X } from 'lucide-react';

interface WholesalePage {
  id: string;
  title: string;
  description?: string;
  hero_title?: string;
  hero_subtitle?: string;
  body_html?: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
}

interface WholesalePageWithSlug extends WholesalePage {
  slug: string;
}

interface PagesResponse {
  pages?: WholesalePageWithSlug[];
}

export default function WholesalePageManagerPage() {
  const [page, setPage] = useState<WholesalePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = useCallback(async () => {
    try {
      const data = (await api.getPages()) as PagesResponse;
      const wholesalePage = data?.pages?.find((p) => p.slug === 'wholesale');
      if (wholesalePage) {
        setPage(wholesalePage);
      }
    } catch (error) {
      console.error('Failed to fetch page:', error);
      setError('Failed to load wholesale page');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  const showSuccess = (message: string) => {
    const successMsg = document.createElement('div');
    successMsg.className =
      'fixed top-4 right-4 z-[100] bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg';
    successMsg.textContent = message;
    document.body.appendChild(successMsg);
    window.setTimeout(() => successMsg.remove(), 3000);
  };

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    setError('');
    try {
      await api.updatePage(page.id, page);
      setEditing(false);
      showSuccess('Wholesale page saved!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!page) return;

    const newPage = { ...page, is_published: !page.is_published };
    setSaving(true);
    setError('');

    try {
      await api.updatePage(page.id, newPage);
      setPage(newPage);
      showSuccess(newPage.is_published ? 'Page published!' : 'Page unpublished!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <div className="mr-3 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
        Loading page...
      </div>
    );
  }

  if (!page) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700">
          Wholesale page not found. You may need to create it first.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wholesale Page</h1>
          <p className="mt-1 text-gray-500">
            Manage the wholesale section content and visibility
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTogglePublish}
            disabled={saving}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
              page.is_published
                ? 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            {page.is_published ? (
              <>
                <Eye size={18} />
                Published
              </>
            ) : (
              <>
                <EyeOff size={18} />
                Draft
              </>
            )}
          </button>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white transition-colors hover:bg-gray-800"
            >
              <Edit2 size={18} />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Page Title
            </h3>
            {editing ? (
              <input
                type="text"
                value={page.title}
                onChange={(e) => setPage({ ...page, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900">{page.title}</p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Hero Section
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Hero Title
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={page.hero_title || ''}
                    onChange={(e) =>
                      setPage({ ...page, hero_title: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-700">
                    {page.hero_title || 'No hero title'}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Hero Subtitle
                </label>
                {editing ? (
                  <textarea
                    value={page.hero_subtitle || ''}
                    onChange={(e) =>
                      setPage({ ...page, hero_subtitle: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-600">
                    {page.hero_subtitle || 'No subtitle'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Body Content
            </h3>
            {editing ? (
              <textarea
                value={page.body_html || ''}
                onChange={(e) => setPage({ ...page, body_html: e.target.value })}
                rows={10}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: page.body_html || '<p>No content</p>',
                }}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              SEO
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Meta Title
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={page.meta_title || ''}
                    onChange={(e) =>
                      setPage({ ...page, meta_title: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-xs text-gray-600">
                    {page.meta_title || 'Not set'}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Meta Description
                </label>
                {editing ? (
                  <textarea
                    value={page.meta_description || ''}
                    onChange={(e) =>
                      setPage({ ...page, meta_description: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-xs text-gray-600">
                    {page.meta_description || 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Preview
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs text-gray-500">Title</p>
                <p className="truncate font-semibold text-blue-600">
                  {page.title}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-500">Meta Description</p>
                <p className="line-clamp-2 text-xs text-gray-700">
                  {page.meta_description || 'No description set'}
                </p>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="mb-2 text-xs text-gray-500">Publishing</p>
                {page.is_published ? (
                  <span className="font-medium text-green-600">Published</span>
                ) : (
                  <span className="font-medium text-gray-600">Draft</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
