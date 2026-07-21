import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'neutral' | 'accent' | 'success' | 'danger' | 'outline';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral:
    'border-border-subtle bg-surface-soft text-secondary',
  accent:
    'border-[var(--ds-accent-primary)] bg-[var(--ds-accent-soft)] text-[var(--ds-accent-hover)]',
  success:
    'border-[var(--ds-success)] bg-[var(--ds-success-bg)] text-success',
  danger:
    'border-[var(--ds-danger)] bg-[var(--ds-surface-paper)] text-error',
  outline:
    'border-border bg-[var(--ds-surface-paper)] text-primary',
};

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border px-2.5 py-1 font-label text-body-xs font-semibold tracking-token-wide leading-token-tight',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
