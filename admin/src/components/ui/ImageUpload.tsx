'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Upload, GripVertical } from 'lucide-react';

export interface ImageItem {
  id: string; // unique id for dnd
  url: string;
  alt_text?: string;
  is_thumbnail?: boolean;
  position?: number;
}

interface ImageUploadProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  onUpload: (file: File) => Promise<string>;
  uploading?: boolean;
  maxFiles?: number;
}

function SortableImage({
  image,
  onRemove,
  onSetThumbnail,
}: {
  image: ImageItem;
  onRemove: (id: string) => void;
  onSetThumbnail: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-lg overflow-hidden border-2 ${image.is_thumbnail ? 'border-blue-500' : 'border-gray-200'} bg-white shadow-sm aspect-square`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1.5 bg-white/80 backdrop-blur rounded-md cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <GripVertical size={16} className="text-gray-600" />
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemove(image.id)}
        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X size={16} />
      </button>

      {/* Image */}
      <div className="w-full h-full relative">
        <img
          src={image.url}
          alt={image.alt_text || 'Product image'}
          className="w-full h-full object-cover"
        />

        {/* Overlay for actions */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onSetThumbnail(image.id)}
            className={`text-xs font-medium px-2 py-1 rounded ${image.is_thumbnail ? 'bg-blue-600 text-white' : 'bg-white/90 text-gray-800 hover:bg-white'}`}
          >
            {image.is_thumbnail ? 'Main Image' : 'Set as Main'}
          </button>
        </div>
      </div>

      {/* Thumbnail Badge */}
      {image.is_thumbnail && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded shadow-sm z-10 pointer-events-none">
          MAIN
        </div>
      )}
    </div>
  );
}

export default function ImageUpload({
  images,
  onChange,
  onUpload,
  uploading = false,
  maxFiles = 10,
}: ImageUploadProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > maxFiles) {
        alert(`Maximum ${maxFiles} images allowed`);
        return;
      }

      const newImages: ImageItem[] = [];

      // Upload each file
      for (const file of acceptedFiles) {
        try {
          const url = await onUpload(file);
          const newImage: ImageItem = {
            id: Math.random().toString(36).substr(2, 9), // simple unique id
            url,
            is_thumbnail: images.length === 0 && newImages.length === 0, // First image is thumbnail by default
            position: images.length + newImages.length,
          };
          newImages.push(newImage);
        } catch (error) {
          console.error('Failed to upload file:', file.name, error);
        }
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
      }
    },
    [images, maxFiles, onUpload, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
    },
    disabled: uploading,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((item) => item.id === active.id);
      const newIndex = images.findIndex((item) => item.id === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      // Update positions
      const reordered = newImages.map((img, idx) => ({
        ...img,
        position: idx,
      }));
      onChange(reordered);
    }
  };

  const handleRemove = (id: string) => {
    const newImages = images.filter((img) => img.id !== id);
    // If we removed the thumbnail, make the first one (if any) the thumbnail
    if (newImages.length > 0 && !newImages.some((img) => img.is_thumbnail)) {
      newImages[0].is_thumbnail = true;
    }
    onChange(newImages);
  };

  const handleSetThumbnail = (id: string) => {
    const newImages = images.map((img) => ({
      ...img,
      is_thumbnail: img.id === id,
    }));
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}
                    ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          {uploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
          ) : (
            <Upload size={24} />
          )}
        </div>
        <p className="text-base font-medium text-gray-900">
          {uploading
            ? 'Uploading...'
            : isDragActive
              ? 'Drop images here'
              : 'Click to upload or drag and drop'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          PNG, JPG, WebP or GIF (Max 50MB)
        </p>
      </div>

      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((img) => img.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  onRemove={handleRemove}
                  onSetThumbnail={handleSetThumbnail}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
