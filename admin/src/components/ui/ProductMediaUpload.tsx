'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useMemo, useState } from 'react';

// Cloudinary delivery uses f_auto/q_auto, but uploads are restricted to browser-safe source formats.
function toDisplayUrl(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  if (url.includes('/f_auto')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
}
import { useDropzone } from 'react-dropzone';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Image as ImageIcon,
  LoaderCircle,
  Play,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';

export type ProductMediaType = 'image' | 'video';

export interface ProductMediaMetadata {
  media_type?: ProductMediaType;
  thumbnail_url?: string;
  mime_type?: string;
  file_size?: number;
  cloudinary_public_id?: string;
}

export interface ProductMediaItem {
  id: string;
  url: string;
  alt_text?: string;
  is_thumbnail?: boolean;
  position?: number;
  metadata?: ProductMediaMetadata | null;
}

interface UploadState {
  id: string;
  label: string;
  progress: number;
  status: string;
  mediaType: ProductMediaType;
  previewUrl?: string;
}

interface ProductMediaUploadProps {
  items: ProductMediaItem[];
  onChange: (items: ProductMediaItem[]) => void;
  onError?: (message: string) => void;
}

const MAX_MEDIA_ITEMS = 14;
const MIN_MEDIA_ITEMS = 3;
const MAX_IMAGE_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

function createItemId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 10);
}

function getMediaType(item: ProductMediaItem): ProductMediaType {
  return item.metadata?.media_type === 'video' ? 'video' : 'image';
}

function getFileMediaType(file: File): ProductMediaType {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';

  const lowercaseName = file.name.toLowerCase();
  if (lowercaseName.endsWith('.mp4') || lowercaseName.endsWith('.mov')) {
    return 'video';
  }

  return 'image';
}

function normalizeItems(items: ProductMediaItem[]): ProductMediaItem[] {
  const hasCover = items.some((item) => item.is_thumbnail);

  return items.map((item, index) => ({
    ...item,
    position: index,
    is_thumbnail: hasCover ? item.is_thumbnail : index === 0,
  }));
}

async function generateVideoPoster(videoFile: File): Promise<File | null> {
  if (typeof document === 'undefined') return null;

  const objectUrl = URL.createObjectURL(videoFile);

  try {
    const video = document.createElement('video');
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(0.15, Math.max(video.duration / 3, 0.05));
      };
      video.onseeked = () => resolve();
      video.onerror = () => reject(new Error('Failed to read video preview'));
    });

    const canvas = document.createElement('canvas');
    const width = 720;
    const ratio = video.videoWidth && video.videoHeight
      ? video.videoHeight / video.videoWidth
      : 5 / 4;
    canvas.width = width;
    canvas.height = Math.round(width * ratio);

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    );

    if (!blob) return null;

    const posterName = videoFile.name.replace(/\.[^.]+$/, '') + '-poster.jpg';
    return new File([blob], posterName, { type: 'image/jpeg' });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function SortableMediaCard({
  item,
  onRemove,
  onSetCover,
  onReplacePoster,
  onUpdateAltText,
}: {
  item: ProductMediaItem;
  onRemove: (id: string) => void;
  onSetCover: (id: string) => void;
  onReplacePoster: (id: string, file: File) => void;
  onUpdateAltText: (id: string, altText: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const mediaType = getMediaType(item);
  const previewUrl =
    mediaType === 'video' ? item.metadata?.thumbnail_url || '' : toDisplayUrl(item.url);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative overflow-hidden rounded-[24px] border bg-white shadow-sm ${
        item.is_thumbnail ? 'border-black' : 'border-gray-200'
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={item.alt_text || 'Product media preview'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
            {mediaType === 'video' ? <Video size={28} /> : <ImageIcon size={28} />}
          </div>
        )}

        {mediaType === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/15">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white">
              <Play size={18} className="ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}

        <div
          {...attributes}
          {...listeners}
          className="absolute left-3 top-3 flex h-10 w-10 cursor-grab items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition active:cursor-grabbing md:opacity-0 md:group-hover:opacity-100"
          aria-label="Reorder media"
        >
          <GripVertical size={18} />
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition hover:text-red-600 md:opacity-0 md:group-hover:opacity-100"
          aria-label="Delete media"
        >
          <X size={18} />
        </button>

        <div className="absolute left-3 bottom-3 flex items-center gap-2">
          <span className="rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
            {mediaType}
          </span>
          {item.is_thumbnail && (
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-black">
              Cover
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSetCover(item.id)}
            className={`min-h-12 flex-1 rounded-2xl border px-3 text-sm font-semibold transition ${
              item.is_thumbnail
                ? 'border-black bg-black text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            {item.is_thumbnail ? 'Cover Media' : 'Set as Cover'}
          </button>

          {mediaType === 'video' && (
            <label className="min-h-12 cursor-pointer rounded-2xl border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center">
              Poster
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onReplacePoster(item.id, file);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          )}
        </div>

        <p className="truncate text-xs text-gray-500">
          {item.url.split('/').pop() || item.url}
        </p>

        <div className="pt-2 border-t border-gray-100">
          <label className="text-xs font-semibold text-gray-700 block mb-1">Alt Text (SEO)</label>
          <input
            type="text"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 transition focus:border-black focus:ring-1 focus:ring-black focus:outline-none placeholder-gray-400"
            placeholder="Describe this image for SEO..."
            value={item.alt_text || ''}
            onChange={(e) => onUpdateAltText(item.id, e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default function ProductMediaUpload({
  items,
  onChange,
  onError,
}: ProductMediaUploadProps) {
  const [uploads, setUploads] = useState<UploadState[]>([]);

  const emitError = useCallback(
    (message: string) => {
      if (onError) {
        onError(message);
        return;
      }

      window.alert(message);
    },
    [onError]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const uploadCount = uploads.length;
  const slotsUsed = items.length;
  const canAddMore = slotsUsed < MAX_MEDIA_ITEMS;

  const updateUploadState = useCallback(
    (id: string, patch: Partial<UploadState>) => {
      setUploads((current) =>
        current.map((upload) =>
          upload.id === id ? { ...upload, ...patch } : upload
        )
      );
    },
    []
  );

  const removeUploadState = useCallback((id: string) => {
    setUploads((current) => {
      const upload = current.find((entry) => entry.id === id);
      if (upload?.previewUrl) {
        URL.revokeObjectURL(upload.previewUrl);
      }
      return current.filter((entry) => entry.id !== id);
    });
  }, []);

  const uploadPosterForVideo = useCallback(
    async (itemId: string, posterFile: File) => {
      if (!posterFile.type.startsWith('image/')) {
        emitError('Poster image must be JPG, PNG, or WebP.');
        return;
      }

      if (posterFile.size > MAX_IMAGE_SIZE) {
        emitError('Poster image must be 5MB or smaller.');
        return;
      }

      const uploadId = createItemId();
      const previewUrl = URL.createObjectURL(posterFile);
      setUploads((current) => [
        ...current,
        {
          id: uploadId,
          label: posterFile.name,
          progress: 0,
          status: 'Uploading poster',
          mediaType: 'image',
          previewUrl,
        },
      ]);

      try {
        const uploadedPoster = await api.uploadMedia(posterFile, (progress) =>
          updateUploadState(uploadId, { progress })
        );

        onChange(
          normalizeItems(
            items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    metadata: {
                      ...item.metadata,
                      media_type: 'video',
                      thumbnail_url: uploadedPoster.url,
                    },
                  }
                : item
            )
          )
        );
      } catch (error) {
        emitError(
          error instanceof Error ? error.message : 'Failed to upload video poster.'
        );
      } finally {
        removeUploadState(uploadId);
      }
    },
    [emitError, items, onChange, removeUploadState, updateUploadState]
  );

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (items.length + acceptedFiles.length > MAX_MEDIA_ITEMS) {
        emitError(`You can upload up to ${MAX_MEDIA_ITEMS} media items per product.`);
        return;
      }

      let nextItems = [...items];

      for (const file of acceptedFiles) {
        const mediaType = getFileMediaType(file);
        const isVideo = mediaType === 'video';
        const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

        if (file.size > maxSize) {
          emitError(
            `${file.name} is too large. ${
              isVideo ? 'Videos' : 'Images'
            } must be ${Math.round(maxSize / 1024 / 1024)}MB or smaller.`
          );
          continue;
        }

        const uploadId = createItemId();
        const previewUrl = URL.createObjectURL(file);

        setUploads((current) => [
          ...current,
          {
            id: uploadId,
            label: file.name,
            progress: 0,
            status: `Uploading ${mediaType}`,
            mediaType,
            previewUrl,
          },
        ]);

        try {
          const uploadedFile = await api.uploadMedia(file, (progress) =>
            updateUploadState(uploadId, { progress })
          );

          let posterUrl: string | undefined;

          if (mediaType === 'video') {
            updateUploadState(uploadId, { status: 'Generating poster', progress: 100 });
            const posterFile = await generateVideoPoster(file);

            if (posterFile) {
              updateUploadState(uploadId, { status: 'Uploading poster', progress: 0 });
              const uploadedPoster = await api.uploadMedia(posterFile, (progress) =>
                updateUploadState(uploadId, { progress })
              );
              posterUrl = uploadedPoster.url;
            }
          }

          nextItems = normalizeItems([
            ...nextItems,
            {
            id: createItemId(),
            url: uploadedFile.url,
            is_thumbnail: nextItems.length === 0,
            position: nextItems.length,
            metadata: {
              media_type: mediaType,
              thumbnail_url: posterUrl,
              mime_type: file.type,
              file_size: file.size,
              cloudinary_public_id: uploadedFile.publicId,
            },
            },
          ]);
          onChange(nextItems);
        } catch (error) {
          emitError(
            error instanceof Error ? error.message : `Failed to upload ${file.name}.`
          );
        } finally {
          removeUploadState(uploadId);
        }
      }
    },
    [
      emitError,
      items,
      removeUploadState,
      updateUploadState,
      onChange,
    ]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        emitError('Only JPG, PNG, WebP, MP4, and MOV files are supported.');
      }
      void handleDrop(acceptedFiles);
    },
    multiple: true,
    disabled: !canAddMore,
    maxFiles: Math.max(MAX_MEDIA_ITEMS - items.length, 0),
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    onChange(normalizeItems(arrayMove(items, oldIndex, newIndex)));
  };

  const summaryText = useMemo(() => {
    if (items.length < MIN_MEDIA_ITEMS) {
      return `Add at least ${MIN_MEDIA_ITEMS} media items for the full storefront gallery.`;
    }

    return 'Gallery is ready for the storefront layout.';
  }, [items.length]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Product Media</h3>
          <p className="mt-1 text-sm text-gray-500">
            Mix images and reels, drag to reorder, and choose the cover asset.
          </p>
        </div>

        <div className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
          {slotsUsed} / {MAX_MEDIA_ITEMS} media added
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`rounded-[28px] border-2 border-dashed p-8 text-center transition ${
          !canAddMore
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
            : isDragActive
              ? 'border-black bg-gray-50'
              : 'cursor-pointer border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
          {uploadCount > 0 ? (
            <LoaderCircle size={26} className="animate-spin" />
          ) : (
            <Upload size={24} />
          )}
        </div>

        <p className="text-base font-semibold text-gray-900">
          {isDragActive
            ? 'Drop files to add them to the gallery'
            : 'Drag and drop media, or click to browse'}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          JPG, PNG, or WEBP up to 50MB each. MP4 or MOV up to 50MB each.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Portrait media works best for the new mobile-first product page.
        </p>
      </div>

      <div className="rounded-[24px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        {summaryText}
      </div>

      {uploads.length > 0 && (
        <div className="space-y-3 rounded-[24px] border border-gray-200 bg-white p-4">
          {uploads.map((upload) => (
            <div key={upload.id} className="flex gap-4 rounded-[20px] border border-gray-100 p-3">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                {upload.previewUrl ? (
                  upload.mediaType === 'video' ? (
                    <>
                      <video
                        src={upload.previewUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white">
                          <Play size={16} className="ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img
                      src={upload.previewUrl}
                      alt={`${upload.label} preview`}
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    {upload.mediaType === 'video' ? <Video size={20} /> : <ImageIcon size={20} />}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-gray-700">
                    {upload.label}
                  </span>
                  <span className="text-xs uppercase tracking-[0.16em] text-gray-500">
                    {upload.status}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-black transition-[width]"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Preview is shown while the file finishes uploading.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <SortableMediaCard
                  key={item.id}
                  item={item}
                  onRemove={(id) =>
                    onChange(normalizeItems(items.filter((item) => item.id !== id)))
                  }
                  onSetCover={(id) =>
                    onChange(
                      normalizeItems(
                        items.map((item) => ({
                          ...item,
                          is_thumbnail: item.id === id,
                        }))
                      )
                    )
                  }
                  onReplacePoster={(id, file) => {
                    void uploadPosterForVideo(id, file);
                  }}
                  onUpdateAltText={(id, altText) =>
                    onChange(
                      items.map((item) =>
                        item.id === id ? { ...item, alt_text: altText } : item
                      )
                    )
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
