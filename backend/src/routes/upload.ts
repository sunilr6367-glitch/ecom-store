import { Hono } from 'hono';
import { verifyAdminOrMcpService } from '../middleware/auth';
import { createHash } from 'crypto';
import { z } from 'zod';
import {
  validateFileUpload,
  getMaxFileSize,
  IMAGE_MAX_FILE_SIZE,
  VIDEO_MAX_FILE_SIZE,
} from '../utils/safe-file-upload';
import {
  uploadImageToCloudinary,
  uploadRawFileToCloudinary,
  uploadVideoToCloudinary,
  uploadFromUrl,
} from '../utils/cloudinary';

const uploadRouter = new Hono();

const FileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  size: z.number().int().positive().max(VIDEO_MAX_FILE_SIZE),
});

uploadRouter.use('*', verifyAdminOrMcpService);

uploadRouter.post('/', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file uploaded' }, 400);
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const effectiveMimeType = file.type || '';

    if (
      ext === 'heic' ||
      ext === 'heif' ||
      effectiveMimeType === 'image/heic' ||
      effectiveMimeType === 'image/heif'
    ) {
      return c.json(
        {
          error:
            'HEIC/HEIF uploads are not supported for SEO media. Export images as JPG, PNG, or WebP before uploading.',
        },
        400
      );
    }

    const validationResult = FileUploadSchema.safeParse({
      filename: file.name,
      mimeType: effectiveMimeType,
      size: file.size,
    });

    if (!validationResult.success) {
      return c.json(
        { error: 'Invalid file upload parameters', details: validationResult.error.errors },
        400
      );
    }

    const maxFileSize = getMaxFileSize(file.name, effectiveMimeType);
    if (file.size > maxFileSize) {
      return c.json(
        { error: `File too large. Maximum size is ${maxFileSize / 1024 / 1024}MB` },
        400
      );
    }

    const validation = validateFileUpload(file.name, effectiveMimeType, file.size);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    // Determine resource type from mime type
    const isVideo = effectiveMimeType.startsWith('video/');
    const folder = isVideo ? 'odhvica/products/videos' : 'odhvica/products/images';

    // Upload to Cloudinary
    const result = isVideo
      ? await uploadVideoToCloudinary(file, { folder })
      : await uploadImageToCloudinary(file, { folder });

    // Generate hash for integrity verification
    const buffer = await file.arrayBuffer();
    const fileHash = createHash('sha256').update(Buffer.from(buffer)).digest('hex');

    console.log('✅ File uploaded to Cloudinary:', {
      originalName: file.name,
      publicId: result.publicId,
      size: file.size,
      type: file.type,
      hash: fileHash,
    });

    return c.json({
      url: result.secureUrl,
      publicId: result.publicId,
      filename: result.publicId,
      originalName: file.name,
      size: file.size,
      type: file.type,
      hash: fileHash,
      limits: {
        image_max_size: IMAGE_MAX_FILE_SIZE,
        video_max_size: VIDEO_MAX_FILE_SIZE,
      },
    });
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return c.json({ error: 'Failed to upload file', details: error.message }, 500);
  }
});

uploadRouter.post('/order-label', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No label PDF uploaded' }, 400);
    }

    const effectiveMimeType = file.type || 'application/pdf';
    const validationResult = FileUploadSchema.safeParse({
      filename: file.name,
      mimeType: effectiveMimeType,
      size: file.size,
    });

    if (!validationResult.success) {
      return c.json(
        { error: 'Invalid label upload parameters', details: validationResult.error.errors },
        400
      );
    }

    if (
      !file.name.toLowerCase().endsWith('.pdf') ||
      effectiveMimeType !== 'application/pdf'
    ) {
      return c.json({ error: 'Only PDF label files are supported' }, 400);
    }

    const validation = validateFileUpload(file.name, effectiveMimeType, file.size);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    const result = await uploadRawFileToCloudinary(file, {
      folder: 'odhvica/orders/labels',
    });

    const buffer = await file.arrayBuffer();
    const fileHash = createHash('sha256').update(Buffer.from(buffer)).digest('hex');

    return c.json({
      url: result.secureUrl,
      publicId: result.publicId,
      filename: validation.secureFilename || file.name,
      originalName: file.name,
      size: file.size,
      type: effectiveMimeType,
      hash: fileHash,
    });
  } catch (error: any) {
    console.error('Label upload error:', error);
    return c.json({ error: 'Failed to upload label PDF', details: error.message }, 500);
  }
});

// POST /upload/from-url — upload to Cloudinary from a remote public URL
uploadRouter.post('/from-url', async (c) => {
  try {
    const { url, filename } = await c.req.json() as { url?: string; filename?: string };

    if (!url || typeof url !== 'string') {
      return c.json({ error: 'url field is required' }, 400);
    }

    // Basic URL validation — must be http/https
    if (!/^https?:\/\//i.test(url)) {
      return c.json({ error: 'url must start with http:// or https://' }, 400);
    }

    if (/\.(heic|heif)(?:$|\?)/i.test(url)) {
      return c.json(
        {
          error:
            'HEIC/HEIF source URLs are not supported for SEO media. Use JPG, PNG, or WebP URLs.',
        },
        400
      );
    }

    const result = await uploadFromUrl(url, { folder: 'odhvica/products/images' });

    return c.json({
      url: result.secureUrl,
      publicId: result.publicId,
      originalUrl: url,
      filename: filename || url.split('/').pop() || 'image',
    });
  } catch (error: any) {
    console.error('❌ URL upload error:', error);
    return c.json({ error: 'Failed to upload from URL', details: error.message }, 500);
  }
});

export default uploadRouter;
