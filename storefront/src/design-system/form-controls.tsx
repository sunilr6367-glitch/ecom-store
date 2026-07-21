'use client';

import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type SelectionControlProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { type?: 'checkbox' | 'radio' };

export const SelectionControl = forwardRef<HTMLInputElement, SelectionControlProps>(
  ({ type = 'checkbox', className, ...props }, ref) => (
    <span className={cn('relative inline-flex h-[var(--ds-control-sm)] w-[var(--ds-control-sm)] shrink-0 items-center justify-center', className)}>
      <input ref={ref} type={type} className="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed" {...props} />
      <span aria-hidden className={cn('h-5 w-5 border border-border-subtle bg-surface-paper peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ds-accent-primary)] peer-disabled:opacity-50', type === 'radio' ? 'rounded-full peer-checked:shadow-[inset_0_0_0_5px_var(--ds-surface-paper)]' : "peer-checked:after:block peer-checked:after:h-3 peer-checked:after:w-1.5 peer-checked:after:translate-x-1.5 peer-checked:after:translate-y-0.5 peer-checked:after:rotate-45 peer-checked:after:border-b-2 peer-checked:after:border-r-2 peer-checked:after:border-inverse peer-checked:after:content-['']")} />
    </span>
  ),
);
SelectionControl.displayName = 'SelectionControl';

export const HiddenCheckbox = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  (props, ref) => <input ref={ref} type="checkbox" className="sr-only" {...props} />,
);
HiddenCheckbox.displayName = 'HiddenCheckbox';

export const CodeInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  ({ className, ...props }, ref) => <input ref={ref} type="text" className={cn('h-16 w-14 border border-border-subtle bg-surface-soft text-center font-ui text-display-sm font-semibold text-primary outline-none transition-colors focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)] md:w-16', className)} {...props} />,
);
CodeInput.displayName = 'CodeInput';
