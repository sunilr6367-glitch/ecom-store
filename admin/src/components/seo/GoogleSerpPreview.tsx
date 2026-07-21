import React from 'react';
import { adminBrandConfig } from '@/config/brand';

interface GoogleSerpPreviewProps {
  title: string;
  description: string;
  url: string;
}

export default function GoogleSerpPreview({
  title,
  description,
  url,
}: GoogleSerpPreviewProps) {
  const displayTitle = title
    ? title.length > 65
      ? `${title.substring(0, 65)}...`
      : title
    : `Page Title Example | ${adminBrandConfig.storeName}`;
  const displayDesc = description
    ? description.length > 160
      ? `${description.substring(0, 160)}...`
      : description
    : 'This is how your product will appear in Google search results. Add a compelling description to improve click-through rate.';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://store.example.com').replace(/\/$/, '');
  const formattedUrl = url ? `${siteUrl} › products › ${url}` : siteUrl;
  const brandInitial = adminBrandConfig.storeName.charAt(0).toUpperCase() || 'K';

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 font-sans text-[14px] leading-normal shadow-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Search Engine Preview
      </h3>
      <div className="max-w-[600px]">
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 p-1">
            <span className="text-xs font-bold text-gray-600">{brandInitial}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[14px] font-medium leading-tight text-[#202124]">
              {adminBrandConfig.storeName}
            </span>
            <span className="truncate text-[12px] leading-tight text-[#4d5156]">
              {formattedUrl}
            </span>
          </div>
        </div>
        <div className="mb-1 cursor-pointer truncate text-[20px] font-medium leading-[1.3] text-[#1a0dab] hover:underline">
          {displayTitle}
        </div>
        <div className="break-words text-[14px] leading-[1.58] text-[#4d5156]">
          {displayDesc}
        </div>
      </div>
    </div>
  );
}
