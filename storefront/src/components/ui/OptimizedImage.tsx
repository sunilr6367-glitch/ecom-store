'use client';

import Image, { type ImageProps } from 'next/image';
import { cloudinaryImageLoader, isCloudinaryUrl, optimizeCloudinaryUrl } from '@/lib/media';

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  fallbackSrc?: string;
}

export default function OptimizedImage({
  alt,
  quality = 75,
  loading,
  sizes,
  ...props
}: OptimizedImageProps) {
  const originalSrc = typeof props.src === 'string' ? props.src : null;
  const isDataUri = typeof props.src === 'string' && props.src.startsWith('data:');
  // Auto-convert HEIC/HEIF and optimize format for browser via Cloudinary
  if (typeof props.src === 'string') {
    let finalSrc = isCloudinaryUrl(props.src) ? props.src : optimizeCloudinaryUrl(props.src);
    
    // Fallback: If it's a local /uploads path (e.g. from seed data), convert to absolute remote URL
    if (finalSrc.startsWith('/uploads/')) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.odhvica.com';
      finalSrc = `${apiUrl.replace(/\/$/, '')}${finalSrc}`;
    }

    props = {
      ...props,
      src: finalSrc,
    };
  }
  // Default loading behavior: lazy unless explicitly priority
  const resolvedLoading: NonNullable<ImageProps['loading']> =
    loading ?? (props.priority ? 'eager' : 'lazy');

  // Default sizes for responsive images when not provided
  const resolvedSizes = sizes ?? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  // If neither width/height nor fill provided, provide sensible defaults
  const shouldProvideDefaults = !props.fill && props.width === undefined && props.height === undefined;
  const defaultWidth = 400;
  const defaultHeight = 400;

  const finalProps: Omit<ImageProps, 'alt'> = {
    quality,
    loading: resolvedLoading,
    sizes: resolvedSizes,
    ...(isDataUri ? { unoptimized: true } : {}),
    ...(originalSrc && isCloudinaryUrl(originalSrc)
      ? { loader: cloudinaryImageLoader }
      : {}),
    ...(shouldProvideDefaults ? { width: defaultWidth, height: defaultHeight } : {}),
    ...props,
  };

  return <Image {...finalProps} alt={alt} />;
}
