'use client';

import { ThumbsUp, Loader2, X, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button, IconButton, Input, OptimizedImage, StarRating, Textarea } from '@/design-system';

interface ReviewsProps {
  productId: string;
}

export function Reviews({ productId }: ReviewsProps) {
  const [reviews, setReviews] = useState<
    Array<{
      id: string;
      title?: string;
      author_name: string;
      content: string;
      rating: number;
      created_at: string;
      images?: string[];
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { customer } = useAuth();

  // Form State
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Image Upload State
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Clean up blob URLs on unmount or when imagePreviewUrls changes
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadError(null);
        const data = await api.getReviews(productId);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error(err);
        setLoadError('Reviews are temporarily unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [productId]);

  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(
        1
      )
    : '0.0';

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    // Validate max 5 images total
    if (selectedImages.length + fileArray.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    // Validate file types and sizes
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        alert(`Invalid file type: ${file.name}. Only images allowed.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Maximum size is 5MB.`);
        return;
      }
    }

    // Create preview URLs
    const newPreviewUrls = fileArray.map((file) => URL.createObjectURL(file));

    setSelectedImages((prev) => [...prev, ...fileArray]);
    setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => {
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];

    setUploadingImages(true);
    const formData = new FormData();
    selectedImages.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await fetch(
        '/api/reviews/upload',
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload images');
      }

      const data = await response.json();
      return data.images || [];
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Upload images first if any
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadImages();
      }

      // Submit review with image URLs
      await api.createReview(productId, {
        rating,
        title,
        content,
        author_name: customer?.first_name || authorName || 'Anonymous',
        customer_id: customer?.id,
        images: imageUrls,
      });

      // Cleanup preview URLs
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setSelectedImages([]);
      setImagePreviewUrls([]);

      setSubmitted(true);
      setShowForm(false);
    } catch {
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-border-subtle py-[var(--ds-space-xl)] md:py-[var(--ds-space-2xl)] lg:py-[var(--ds-space-3xl)]" id="reviews">
      <div className="ds-page-container mx-auto max-w-page">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-[var(--ds-space-md)]">
          <div>
            <h2 className="review-heading mb-2">
              Client Reviews
            </h2>
            <div className="flex items-center gap-[var(--ds-space-xs)]">
              <StarRating rating={Number(averageRating)} size={18} />
              <span className="review-rating-count">
                {averageRating} ({reviews.length} Reviews)
              </span>
            </div>
          </div>

          {!submitted && (
            <Button
              type="button"
              onClick={() => setShowForm(!showForm)}
              variant="outline"
              size="md"
            >
              {showForm ? 'Cancel' : 'Write a Review'}
            </Button>
          )}
        </div>

        {/* Review Form */}
        {showForm && !submitted && (
          <form
            onSubmit={handleSubmit}
            className="max-w-xl bg-surface-soft p-8 mb-12 rounded-lg space-y-4"
          >
            <h3 className="review-form-heading mb-4">Share Your Experience</h3>

            <div>
              <label className="review-label mb-2 block">
                Rating
              </label>
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                editable
                size={24}
              />
            </div>

            {!customer && (
              <div>
                <Input
                  type="text"
                  label="Name"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your Name"
                />
              </div>
            )}

            <div>
              <Input
                type="text"
                label="Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summary of your experience"
              />
            </div>

            <div>
              <Textarea
                label="Review"
                required
                className="min-h-[100px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="How was the quality, fit, and delivery?"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="review-label mb-2 block">
                Add Photos (Optional)
              </label>

              {/* Selected Images Preview */}
              {imagePreviewUrls.length > 0 && (
                <div className="flex flex-wrap gap-[var(--ds-space-xs)] mb-3">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <div className="w-20 h-20 relative rounded overflow-hidden border border-border-subtle">
                        <OptimizedImage
                          src={url}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <IconButton
                        type="button"
                        onClick={() => removeImage(index)}
                        variant="primary"
                        size="sm"
                        className="absolute -right-1 -top-1 h-6 w-6 border-danger bg-danger text-inverse hover:border-danger hover:bg-danger"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X size={12} />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {selectedImages.length < 5 && (
                <label className="flex items-center gap-[var(--ds-space-xs)] cursor-pointer w-fit">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="review-upload-action flex items-center gap-2 rounded border border-border-subtle px-4 py-2 transition-colors hover:bg-surface-soft">
                    <Upload size={16} />
                    <span>Upload Images</span>
                  </div>
                </label>
              )}

              <p className="review-helper mt-1">
                {selectedImages.length}/5 images / Max 5MB each / JPG, PNG, WebP
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting || uploadingImages}
              variant="secondary"
              size="md"
              fullWidth
              leadingIcon={(submitting || uploadingImages) ? <Loader2 className="animate-spin" size={16} /> : null}
            >
              {uploadingImages
                ? 'Uploading Images...'
                : submitting
                  ? 'Submitting...'
                  : 'Submit Review'}
            </Button>
          </form>
        )}

        {submitted && (
          <div className="bg-success-bg text-success p-6 mb-12 rounded-lg text-center">
            <h3 className="review-success-title mb-2">Thank you!</h3>
            <p className="review-success-copy">
              Your review has been submitted and is pending approval.
            </p>
          </div>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-12 text-muted">
            Loading reviews...
          </div>
        ) : loadError ? (
          <div className="text-center py-12 bg-danger-bg text-error">
            {loadError}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-surface-soft text-secondary italic">
            No reviews yet. Be the first to review this product.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-[var(--ds-space-md)]">
            {reviews.map((review) => (
              <div key={review.id} className="bg-surface-soft p-8 relative group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="mb-2">
                      <StarRating rating={review.rating} size={14} />
                    </div>
                    <h3 className="review-title inline-block border-b border-transparent pb-1 transition-colors group-hover:border-border-subtle">
                      {review.title}
                    </h3>
                  </div>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="review-text mb-4">
                  &quot;{review.content}&quot;
                </p>

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex flex-wrap gap-[var(--ds-space-xs)] mb-4">
                    {review.images.map((imageUrl, imgIndex) => (
                      <div
                        key={imgIndex}
                        className="w-20 h-20 relative rounded overflow-hidden border border-border-subtle"
                      >
                        <OptimizedImage
                          src={imageUrl}
                          alt={`Review photo ${imgIndex + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-border-subtle pt-4">
                  <div className="review-rating-count">
                    <span className="review-author">
                      {review.author_name}
                    </span>
                    <span className="review-verified ml-2">
                      - Verified Buyer
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="review-helpful-action"
                    leadingIcon={<ThumbsUp size={12} />}
                  >
                    Helpful
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
