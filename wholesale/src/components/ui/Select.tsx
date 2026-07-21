'use client';

import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, className, containerClassName, id, children, required, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const helpId = selectId ? `${selectId}-helper` : undefined;
    const errorId = selectId ? `${selectId}-error` : undefined;

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label ? (
          <label
            htmlFor={selectId}
            className="form-label-typography  text-muted"
          >
            {label}
            {required ? <span className="ml-1 text-error">*</span> : null}
          </label>
        ) : null}

        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helpId : undefined}
          className={cn(
            'form-control-typography h-12 w-full border bg-[var(--ds-surface-paper)] px-3 text-primary outline-none transition-colors focus:border-[var(--ds-accent-primary)] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11',
            error ? 'border-[var(--ds-danger)]' : 'border-border-subtle',
            className
          )}
          {...props}
        >
          {children}
        </select>

        {helperText && !error ? (
          <p id={helpId} className="text-body-xs text-muted">
            {helperText}
          </p>
        ) : null}

        {error ? (
          <p id={errorId} role="alert" className="input-error-message mt-0.5 text-error">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
