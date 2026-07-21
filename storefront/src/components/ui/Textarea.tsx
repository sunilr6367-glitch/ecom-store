'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...rest }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="form-label-typography  text-muted"
          >
            {label}
            {rest.required && <span className="ml-1 text-error">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          {...rest}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : rest['aria-describedby']}
          className={cn(
            'form-control-typography min-h-[120px] w-full resize-y border bg-surface-paper p-3 text-primary outline-none transition-colors placeholder:text-muted focus:border-accent disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-danger' : 'border-border-subtle',
            className
          )}
        />

        {error && (
          <p
            id={errorId}
            role="alert"
            className="input-error-message mt-0.5 text-error"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
