import { createHash } from 'crypto';

interface CloudinaryUploadOptions {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw';
}

interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
}

export function normalizeCloudinaryUrl(url?: string | null): string | null {
  if (!url) return null;
  if (!url.includes('/res.cloudinary.com/')) return url;

  const seoSafeUrl = url.replace(/\.(heic|heif)(?=$|[?#])/i, '.jpg');
  if (seoSafeUrl.includes('/f_auto') && seoSafeUrl.includes('/q_auto')) {
    return seoSafeUrl;
  }
  if (seoSafeUrl.includes('/upload/')) {
    return seoSafeUrl.replace('/upload/', '/upload/f_auto,q_auto/');
  }

  return seoSafeUrl;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function createSignature(
  params: Record<string, string | number | undefined>,
  apiSecret: string
): string {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return createHash('sha1')
    .update(`${serialized}${apiSecret}`)
    .digest('hex');
}

export async function uploadImageToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const cloudName = getRequiredEnv('CLOUDINARY_CLOUD_NAME');
  const apiKey = getRequiredEnv('CLOUDINARY_API_KEY');
  const apiSecret = getRequiredEnv('CLOUDINARY_API_SECRET');
  const folder = options.folder || 'odhvica/hero-banners';
  const resourceType = options.resourceType || 'image';
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = createSignature(
    {
      folder,
      timestamp,
    },
    apiSecret
  );

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);

  const uploadTimeoutMs = resourceType === 'video' ? 300000 : 60000;

  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(uploadTimeoutMs),
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      ['AbortError', 'TimeoutError'].includes(error.name)
    ) {
      throw new Error(
        `Timed out uploading ${resourceType} to Cloudinary after ${Math.round(
          uploadTimeoutMs / 1000
        )} seconds`
      );
    }

    throw error;
  }

  const payload = (await response.json().catch(() => null)) as
    | { secure_url?: string; public_id?: string; error?: { message?: string } }
    | null;

  if (!response.ok || !payload?.secure_url || !payload.public_id) {
    throw new Error(
      payload?.error?.message || 'Failed to upload image to Cloudinary'
    );
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
  };
}

export async function uploadVideoToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  return uploadImageToCloudinary(file, {
    ...options,
    resourceType: 'video',
  });
}

export async function uploadRawFileToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  return uploadImageToCloudinary(file, {
    ...options,
    resourceType: 'raw',
  });
}

// Upload to Cloudinary from a remote URL (e.g. public Google Drive link)
export async function uploadFromUrl(
  url: string,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const cloudName = getRequiredEnv('CLOUDINARY_CLOUD_NAME');
  const apiKey = getRequiredEnv('CLOUDINARY_API_KEY');
  const apiSecret = getRequiredEnv('CLOUDINARY_API_SECRET');
  const folder = options.folder || 'odhvica/products/images';
  const resourceType = options.resourceType || 'image';
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = createSignature({ folder, timestamp }, apiSecret);

  const formData = new FormData();
  formData.append('file', url);          // Cloudinary accepts URL as file
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: 'POST', body: formData, signal: AbortSignal.timeout(120000) }
  );

  const payload = (await response.json().catch(() => null)) as
    | { secure_url?: string; public_id?: string; error?: { message?: string } }
    | null;

  if (!response.ok || !payload?.secure_url || !payload.public_id) {
    throw new Error(payload?.error?.message || 'Failed to upload from URL to Cloudinary');
  }

  return { secureUrl: payload.secure_url, publicId: payload.public_id };
}
