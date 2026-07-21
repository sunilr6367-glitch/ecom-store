'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'form-control-typography h-12 w-full border bg-surface-paper px-3 text-primary outline-none transition-colors placeholder:text-muted focus:border-accent disabled:cursor-not-allowed disabled:opacity-50 sm:h-11',
  {
    variants: {
      hasError: {
        true: 'border-danger', // using custom if not in tailwind map yet, but we will add it
        false: 'border-border-subtle',
      },
      hasSuffix: {
        true: 'pr-11',
        false: '',
      },
    },
    defaultVariants: {
      hasError: false,
      hasSuffix: false,
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  suffix?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, suffix, className, containerClassName, id, hasError, hasSuffix, ...rest }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const isError = hasError || Boolean(error);
    const isSuffix = hasSuffix || Boolean(suffix);

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="form-label-typography text-muted">
            {label}
            {rest.required && <span className="ml-1 text-error">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            {...rest}
            aria-invalid={isError}
            aria-describedby={isError ? errorId : rest['aria-describedby']}
            placeholder={rest.placeholder}
            className={cn(inputVariants({ hasError: isError, hasSuffix: isSuffix, className }))}
          />
          {suffix && (
            <div className="absolute right-0 top-0 flex h-full items-center pr-3">
              {suffix}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="input-error-message mt-0.5 text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export default Input;
