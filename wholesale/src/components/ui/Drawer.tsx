'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui/Button';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  side?: 'left' | 'right' | 'bottom';
  className?: string;
  bodyClassName?: string;
  showHeader?: boolean;
}

const sideClasses = {
  left: 'left-0 top-0 h-full w-full max-w-[420px]',
  right: 'right-0 top-0 h-full w-full max-w-[420px]',
  bottom: 'inset-x-0 bottom-0 max-h-[88vh] w-full',
};

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
  className,
  bodyClassName,
  showHeader = true,
}: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--ds-z-overlay)]">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(var(--ds-ink-rgb),0.42)]"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'absolute flex flex-col overflow-hidden border-border-subtle bg-[var(--ds-surface-paper)] text-primary shadow-[var(--ds-shadow)]',
          side === 'bottom' ? 'border-t' : 'border-l',
          sideClasses[side],
          className
        )}
      >
        {showHeader ? (
          <div className="flex items-center justify-between gap-4 border-b border-border-subtle p-5">
            {title ? (
              <h2 className="font-display text-display-sm font-semibold leading-token-tight">
                {title}
              </h2>
            ) : <span />}
            <IconButton aria-label="Close drawer" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </div>
        ) : null}
        <div className={cn('min-h-0 flex-1 overflow-y-auto p-[var(--ds-space-md)]', bodyClassName)}>
          {children}
        </div>
      </aside>
    </div>
  );
}

