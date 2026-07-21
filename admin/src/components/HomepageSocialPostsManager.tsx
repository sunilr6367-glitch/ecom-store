'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Images, Pencil, Plus, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';

interface SocialPost {
  id: string;
  image_url: string;
  alt_text: string;
  caption: string | null;
  destination_url: string;
  is_active: boolean;
  sort_order: number;
}

type FormState = {
  altText: string;
  caption: string;
  destinationUrl: string;
  sortOrder: string;
  isActive: boolean;
  image: File | null;
  preview: string;
};

const emptyForm = (): FormState => ({
  altText: '',
  caption: '',
  destinationUrl: '',
  sortOrder: '0',
  isActive: true,
  image: null,
  preview: '',
});

export default function HomepageSocialPostsManager() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<SocialPost | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const previewRef = useRef('');

  useEffect(() => {
    void load();
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getHomepageSocialPosts();
      setPosts(data.posts || []);
    } finally {
      setLoading(false);
    }
  }

  function clearPreview() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = '';
  }

  function close() {
    clearPreview();
    setOpen(false);
    setEditing(null);
    setForm(emptyForm());
  }

  function create() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function edit(post: SocialPost) {
    setEditing(post);
    setForm({
      altText: post.alt_text,
      caption: post.caption || '',
      destinationUrl: post.destination_url,
      sortOrder: String(post.sort_order),
      isActive: post.is_active,
      image: null,
      preview: post.image_url,
    });
    setOpen(true);
  }

  function formData() {
    const data = new FormData();
    data.append('alt_text', form.altText);
    data.append('caption', form.caption);
    data.append('destination_url', form.destinationUrl);
    data.append('sort_order', form.sortOrder);
    data.append('is_active', String(form.isActive));
    if (form.image) data.append('image', form.image);
    return data;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing && !form.image) {
      alert('Choose an image');
      return;
    }
    setSaving(true);
    try {
      if (editing) await api.updateHomepageSocialPost(editing.id, formData());
      else await api.createHomepageSocialPost(formData());
      close();
      await load();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to save social post');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id: string) {
    await api.toggleHomepageSocialPost(id);
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this social gallery post?')) return;
    await api.deleteHomepageSocialPost(id);
    await load();
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between rounded-2xl border bg-white p-6">
        <div>
          <h1 className="text-2xl font-bold">Homepage Social Gallery</h1>
          <p className="mt-1 text-sm text-gray-500">
            Only active Cloudinary images appear in Follow Our Journey.
          </p>
        </div>
        <button onClick={create} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={18} /> Add post
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">Loading…</div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
          <Images className="mx-auto text-gray-400" />
          <p className="mt-3 text-gray-600">No social gallery posts yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-2xl border bg-white">
              <div className="relative aspect-square bg-gray-100">
                <Image src={post.image_url} alt={post.alt_text} fill sizes="33vw" className="object-cover" />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex gap-2 text-xs">
                  <span className="rounded-full bg-gray-100 px-2 py-1">#{post.sort_order}</span>
                  <span className={`rounded-full px-2 py-1 ${post.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {post.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="font-medium text-gray-900">{post.alt_text}</p>
                <p className="line-clamp-2 text-sm text-gray-500">{post.caption}</p>
                <div className="flex gap-2">
                  <button onClick={() => toggle(post.id)} className="rounded-lg border p-2" aria-label="Toggle post">
                    {post.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={() => edit(post)} className="rounded-lg border p-2" aria-label="Edit post"><Pencil size={16} /></button>
                  <button onClick={() => remove(post.id)} className="rounded-lg border border-red-200 p-2 text-red-600" aria-label="Delete post"><Trash2 size={16} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editing ? 'Edit post' : 'Add post'}</h2>
              <button type="button" onClick={close} aria-label="Close"><X /></button>
            </div>
            {form.preview ? (
              <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                <Image src={form.preview} alt="Preview" fill sizes="500px" className="object-cover" unoptimized={form.preview.startsWith('blob:')} />
              </div>
            ) : null}
            <label className="block text-sm font-medium">
              Image {editing ? '' : '*'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-2 block w-full rounded-xl border p-3"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  if (!file) return;
                  clearPreview();
                  const preview = URL.createObjectURL(file);
                  previewRef.current = preview;
                  setForm((current) => ({ ...current, image: file, preview }));
                }}
              />
            </label>
            <label className="block text-sm font-medium">Alt text *
              <input required value={form.altText} onChange={(e) => setForm({ ...form, altText: e.target.value })} className="mt-2 w-full rounded-xl border p-3" />
            </label>
            <label className="block text-sm font-medium">Caption
              <textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="mt-2 w-full rounded-xl border p-3" />
            </label>
            <label className="block text-sm font-medium">Destination *
              <input required value={form.destinationUrl} onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })} className="mt-2 w-full rounded-xl border p-3" placeholder="https://instagram.com/…" />
            </label>
            <label className="block text-sm font-medium">Sort order
              <input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="mt-2 w-full rounded-xl border p-3" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active on storefront
            </label>
            <div className="flex justify-end gap-3 border-t pt-4">
              <button type="button" onClick={close} className="rounded-xl border px-4 py-2">Cancel</button>
              <button disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
