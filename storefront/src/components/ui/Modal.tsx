'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui/Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  rootClassName?: string;
  bodyClassName?: string;
  showHeader?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  rootClassName,
  bodyClassName,
  showHeader = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const focusDialog = () => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const firstFocusable = dialog.querySelector<HTMLElement>(focusableSelector);
      (firstFocusable || dialog).focus();
    };

    const focusTimer = window.setTimeout(focusDialog, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className={cn('fixed inset-0 z-[var(--ds-z-modal)] flex items-center justify-center p-4', rootClassName)}>
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(var(--ds-ink-rgb),0.48)]"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto border border-border-subtle bg-surface-paper text-primary shadow-[var(--ds-shadow)]',
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
            <IconButton aria-label="Close modal" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </div>
        ) : null}
        <div className={cn('p-[var(--ds-space-md)]', bodyClassName)}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
