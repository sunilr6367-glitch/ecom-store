import React from 'react';

interface GoogleSerpPreviewProps {
  title: string;
  description: string;
  url: string;
}

export default function GoogleSerpPreview({ title, description, url }: GoogleSerpPreviewProps) {
  // Google truncates title at ~60 chars and description at ~155-160 chars in pixel length, but for simulation we use char counts
  const displayTitle = title ? (title.length > 65 ? `${title.substring(0, 65)}...` : title) : 'Page Title Example | Odhvica';
  const displayDesc = description ? (description.length > 160 ? `${description.substring(0, 160)}...` : description) : 'This is how your product will appear in Google search results. Please provide a compelling description to improve your click-through rate.';
  
  // Format URL nicely (e.g. https://odhvica.com > products > ...)
  const domain = 'odhvica.com';
  let formattedUrl = `https://${domain}`;
  if (url) {
    formattedUrl = `https://${domain} › products › ${url}`;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 font-sans text-[14px] leading-normal shadow-sm mt-6">
      <h3 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Search Engine Preview</h3>
      <div className="max-w-[600px]">
        {/* URL and Breadcrumb */}
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 p-1">
            <span className="text-xs font-bold text-gray-600">O</span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[14px] text-[#202124] leading-tight font-medium truncate">Odhvica</span>
            <span className="text-[12px] text-[#4d5156] leading-tight truncate">
              {formattedUrl}
            </span>
          </div>
        </div>
        
        {/* Title link */}
        <div className="text-[20px] text-[#1a0dab] leading-[1.3] font-medium truncate mb-1 hover:underline cursor-pointer">
          {displayTitle}
        </div>
        
        {/* Description text */}
        <div className="text-[14px] text-[#4d5156] leading-[1.58] break-words">
          {displayDesc}
        </div>
      </div>
    </div>
  );
}
