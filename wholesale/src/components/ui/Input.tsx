'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: React.ReactNode;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, suffix, className = '', containerClassName = '', id, ...rest }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="form-label-typography  text-muted"
          >
            {label}
            {rest.required && <span className="ml-1 text-error">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            {...rest}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : rest['aria-describedby']}
            placeholder={rest.placeholder}
            className={cn(
              'form-control-typography h-12 w-full border bg-[var(--ds-surface-paper)] px-3 text-primary outline-none transition-colors placeholder:text-muted focus:border-[var(--ds-accent-primary)] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11',
              suffix && 'pr-11',
              error ? 'border-[var(--ds-danger)]' : 'border-border-subtle',
              className
            )}
          />
          {suffix && (
            <div className="absolute right-0 top-0 flex h-full items-center pr-3">
              {suffix}
            </div>
          )}
        </div>

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

Input.displayName = 'Input';
export default Input;
