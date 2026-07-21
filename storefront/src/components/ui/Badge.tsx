import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 border px-2.5 py-1 font-label text-body-xs font-semibold tracking-token-wide leading-token-tight',
  {
    variants: {
      variant: {
        neutral: 'border-border-subtle bg-surface-soft text-secondary',
        accent: 'border-accent bg-accent-soft text-accent-hover',
        success: 'border-success bg-success-bg text-success',
        danger: 'border-danger bg-surface-paper text-error',
        outline: 'border-border bg-surface-paper text-primary',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
