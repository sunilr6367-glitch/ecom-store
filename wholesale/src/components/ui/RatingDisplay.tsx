import type { HTMLAttributes } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingDisplayProps extends HTMLAttributes<HTMLDivElement> {
  rating?: number | null;
  count?: number | null;
  href?: string;
  emptyLabel?: string;
  starSize?: number;
}

export function RatingDisplay({
  rating,
  count,
  href,
  emptyLabel,
  starSize = 12,
  className,
  ...props
}: RatingDisplayProps) {
  const hasRating = typeof rating === 'number' && rating > 0;

  if (!hasRating) {
    if (!emptyLabel) return null;
    const emptyContent = (
      <span className="font-body text-body-xs font-semibold text-muted">
        {emptyLabel}
      </span>
    );

    return (
      <div className={cn('inline-flex items-center gap-[var(--ds-space-xs)]', className)} {...props}>
        {href ? (
          <a href={href} className="transition-colors hover:text-primary">
            {emptyContent}
          </a>
        ) : (
          emptyContent
        )}
      </div>
    );
  }

  const roundedRating = Math.max(0, Math.min(5, Math.round(rating)));
  const label =
    count && count > 0
      ? `${rating.toFixed(1)} / 5 - ${count.toLocaleString()} reviews`
      : `${rating.toFixed(1)} / 5`;
  const text = count && count > 0 ? `${rating.toFixed(1)} - ${count.toLocaleString()} reviews` : rating.toFixed(1);

  const content = (
    <>
      <span
        aria-hidden="true"
        className="inline-flex items-center gap-0.5 text-[var(--ds-accent-gold)]"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={starSize}
            fill={star <= roundedRating ? 'currentColor' : 'none'}
            className={star <= roundedRating ? 'text-[var(--ds-accent-gold)]' : 'text-[var(--ds-border-strong)]'}
          />
        ))}
      </span>
      <span className="font-body text-body-xs font-semibold text-muted">
        {text}
      </span>
    </>
  );

  return (
    <div
      className={cn('inline-flex items-center gap-[var(--ds-space-xs)]', className)}
      role={href ? undefined : 'img'}
      aria-label={label}
      {...props}
    >
      {href ? (
        <a
          href={href}
          className="inline-flex items-center gap-2 transition-colors hover:text-primary"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
