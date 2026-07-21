'use client';
/* eslint-disable @next/next/no-img-element */

import { useRef, useState, type ChangeEvent } from 'react';
import { Upload, X } from 'lucide-react';
import { api } from '@/lib/api';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
  required?: boolean;
  accept?: string;
  maxSizeMb?: number;
  uploadButtonText?: string;
  previewClassName?: string;
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  helpText,
  required = false,
  accept = 'image/*',
  maxSizeMb = 5,
  uploadButtonText = 'Upload image',
  previewClassName = 'aspect-[16/9]',
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`Image must be ${maxSizeMb}MB or smaller`);
      event.target.value = '';
      return;
    }

    try {
      setUploading(true);
      const result = await api.uploadImage(file);
      onChange(result.url || '');
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to upload image'
      );
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required ? ' *' : ''}
      </label>

      {value ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className={`relative ${previewClassName} bg-gray-50`}>
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-gray-500">{value}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : uploadButtonText}
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <X size={14} />
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            'Uploading...'
          ) : (
            <>
              <Upload size={18} />
              {uploadButtonText}
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />

      {helpText ? <p className="text-xs text-gray-500">{helpText}</p> : null}
    </div>
  );
}
