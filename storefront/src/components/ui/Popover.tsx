import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface PopoverPanelProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'right';
}

export function PopoverPanel({
  align = 'right',
  className,
  children,
  ...props
}: PopoverPanelProps) {
  return (
    <div
      className={cn(
        'absolute z-50 mt-2 overflow-hidden border border-border-subtle bg-surface-paper text-primary shadow-[var(--ds-shadow)]',
        align === 'right' ? 'right-0' : 'left-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
