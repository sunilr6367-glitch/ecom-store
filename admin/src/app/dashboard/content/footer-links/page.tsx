'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  FileText,
  Download,
  Save,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

interface FooterLink {
  key: string;
  label: string;
  value: string;
  placeholder: string;
}

interface FooterSettingsResponse {
  settings?: Record<string, string>;
}

const DEFAULT_FOOTER_LINKS: FooterLink[] = [
  {
    key: 'wholesale_footer_catalog_link',
    label: 'Product Catalog (PDF)',
    value: '',
    placeholder: 'e.g., /documents/catalog-2024.pdf',
  },
  {
    key: 'wholesale_footer_price_list_link',
    label: 'Price List',
    value: '',
    placeholder: 'e.g., /documents/price-list-2024.pdf',
  },
  {
    key: 'wholesale_footer_terms_link',
    label: 'Terms & Conditions',
    value: '',
    placeholder: 'e.g., /pages/terms-of-service',
  },
  {
    key: 'wholesale_footer_shipping_link',
    label: 'Shipping Policy',
    value: '',
    placeholder: 'e.g., /pages/shipping-returns',
  },
  {
    key: 'wholesale_footer_return_link',
    label: 'Return Policy',
    value: '',
    placeholder: 'e.g., /pages/returns',
  },
];

export default function FooterLinksPage() {
  const [links, setLinks] = useState<FooterLink[]>(DEFAULT_FOOTER_LINKS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFooterLinks();
  }, []);

  const fetchFooterLinks = async () => {
    try {
      setLoading(true);
      const data = (await api.getFooterSettings()) as FooterSettingsResponse;
      
      if (data.settings) {
        const settings = data.settings ?? {};
        const updatedLinks = DEFAULT_FOOTER_LINKS.map((link) => ({
          ...link,
          value: settings[link.key] || '',
        }));
        setLinks(updatedLinks);
      }
    } catch (err) {
      console.error('Error fetching footer links:', err);
      setError('Failed to load footer links');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const settingsToUpdate: Record<string, string> = {};
      links.forEach((link) => {
        settingsToUpdate[link.key] = link.value;
      });

      await api.updateSettingsBulk(settingsToUpdate);
      setSuccess('Footer links saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      console.error('Error saving footer links:', err);
      setError(err instanceof Error ? err.message : 'Failed to save footer links');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.key === key ? { ...link, value } : link
      )
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Footer PDF Links Management
        </h1>
        <p className="text-gray-600">
          Manage the PDF links displayed in the wholesale footer section
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center mb-6">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center mb-6">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">How to use</h3>
            <p className="text-sm text-blue-700 mt-1">
              Enter the URL for each link. You can use:
            </p>
            <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
              <li>PDF files: <code className="bg-blue-100 px-1 rounded">/documents/filename.pdf</code></li>
              <li>Page links: <code className="bg-blue-100 px-1 rounded">/pages/page-slug</code></li>
              <li>External links: <code className="bg-blue-100 px-1 rounded">https://example.com/doc.pdf</code></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Links Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-4 text-gray-600">Loading footer links...</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-6">
              {links.map((link) => (
                <div key={link.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {link.label}
                    </label>
                    <p className="text-xs text-gray-500">
                      Key: <code className="bg-gray-100 px-1 rounded">{link.key}</code>
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={link.value}
                        onChange={(e) => handleChange(link.key, e.target.value)}
                        placeholder={link.placeholder}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {link.value && (
                        <a
                          href={link.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-600"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
              <button
                onClick={fetchFooterLinks}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Refresh
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Section */}
      <div className="mt-8 bg-stone-900 text-white rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Preview - How it will appear
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.slice(0, 4).map((link) => (
            <div
              key={link.key}
              className={`p-3 rounded border ${
                link.value
                  ? 'border-stone-700 bg-stone-800'
                  : 'border-stone-700 bg-stone-800/50 opacity-50'
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                {link.value ? (
                  <Download className="w-4 h-4 text-amber-400" />
                ) : (
                  <FileText className="w-4 h-4 text-stone-500" />
                )}
                <span className={link.value ? 'text-amber-400' : 'text-stone-500'}>
                  {link.label}
                </span>
              </div>
              {!link.value && (
                <p className="text-xs text-stone-500 mt-1">Not configured</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
