'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface ImageWithFallbackProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackSrc?: string;
}

export default function ImageWithFallback({
  src,
  fallbackSrc: _fallbackSrc = '/placeholder.png',
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-warm ${props.className || ''}`}
        style={props.style}
      >
        <div className="p-4 text-center text-muted">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-body-xs  tracking-token-wider">No Image</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-surface-soft">
      {isLoading && (
        <div
          className={`absolute inset-0 animate-pulse bg-surface-warm ${props.className || ''}`}
          style={props.style}
        />
      )}
      <Image
        src={src}
        alt={alt || ''}
        onError={() => setError(true)}
        onLoad={() => setIsLoading(false)}
        {...props}
      />
    </div>
  );
}

