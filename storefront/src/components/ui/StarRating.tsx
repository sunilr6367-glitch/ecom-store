'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { UnstyledButton } from '@/components/ui/Button';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  editable?: boolean;
  size?: number;
}

export function StarRating({
  rating,
  onRatingChange,
  editable = false,
  size = 16,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div
      className="flex gap-1"
      onMouseLeave={() => setHoverRating(0)}
      role={editable ? 'radiogroup' : 'img'}
      aria-label={
        editable ? `Rating: ${rating} out of 5 stars` : `${rating} stars`
      }
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <UnstyledButton
          key={star}
          type="button"
          onClick={() => editable && onRatingChange?.(star)}
          onMouseEnter={() => editable && setHoverRating(star)}
          className={`${editable ? 'cursor-pointer' : 'cursor-default'} transition-colors`}
          disabled={!editable}
          aria-label={editable ? `Rate ${star} stars` : `${star} star`}
          aria-pressed={editable && (hoverRating || rating) >= star}
          role={editable ? 'radio' : undefined}
          aria-checked={editable ? (hoverRating || rating) >= star : undefined}
        >
          <Star
            size={size}
            fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'}
            className={
              (hoverRating || rating) >= star
                ? 'text-accent-gold'
                : 'text-border'
            }
          />
        </UnstyledButton>
      ))}
    </div>
  );
}
