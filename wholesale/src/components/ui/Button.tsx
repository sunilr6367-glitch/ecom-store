import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import type { LinkProps } from 'next/link';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'pdp' | 'success' | 'compact' | 'inline' | 'categoryOverlay' | 'product-card';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

interface ButtonLinkProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

interface ButtonAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-[var(--ds-accent-primary)] bg-[var(--ds-accent-primary)] text-inverse hover:bg-[var(--ds-accent-hover)] hover:border-[var(--ds-accent-hover)]',
  secondary:
    'border-[var(--ds-accent-primary)] bg-[var(--ds-accent-primary)] text-inverse hover:bg-[var(--ds-accent-hover)] hover:border-[var(--ds-accent-hover)]',
  outline:
    'border-border-subtle bg-surface text-primary hover:bg-[var(--ds-text-primary)] hover:text-inverse',
  ghost:
    'border-transparent bg-transparent text-primary hover:bg-surface-soft',
  danger:
    'border-[var(--ds-danger)] bg-[var(--ds-danger-bg)] text-error hover:bg-[var(--ds-surface-paper)]',
  accent:
    'border-[var(--ds-accent-primary)] bg-[var(--ds-accent-primary)] text-inverse hover:bg-[var(--ds-accent-hover)] hover:border-[var(--ds-accent-hover)]',
  pdp:
    'bg-[var(--ds-accent-primary)] text-inverse border-[var(--ds-accent-primary)] hover:bg-[var(--ds-accent-hover)] hover:border-[var(--ds-accent-hover)] w-full',
  success:
    'bg-[var(--ds-success-bg)] text-success border-[var(--ds-success)] hover:bg-[var(--ds-surface-paper)]',
  compact:
    'bg-surface-soft text-primary border-border-subtle hover:bg-[var(--ds-border-subtle)] hover:border-border-subtle text-body-xs py-1 px-3',
  inline:
    'bg-transparent text-accent border-transparent hover:text-[var(--ds-accent-hover)] underline underline-offset-2 p-0 h-auto',
  categoryOverlay:
    'bg-[rgba(var(--ds-white-rgb),0.15)] text-inverse border-[rgba(var(--ds-white-rgb),0.3)] hover:bg-[rgba(var(--ds-white-rgb),0.25)] backdrop-blur-sm',
  'product-card':
    'bg-surface text-primary border-border-subtle hover:bg-surface-soft hover:border-border-subtle text-body-xs',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-[var(--ds-space-xs)] text-body-xs',
  md: 'min-h-11 px-[var(--ds-space-md)] text-body-xs',
  lg: 'min-h-12 px-[var(--ds-space-lg)] text-body-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      leadingIcon,
      trailingIcon,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 border font-ui font-semibold tracking-token-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)] disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
);

Button.displayName = 'Button';

export function ButtonLink({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        'inline-flex items-center justify-center gap-2 border font-ui font-semibold tracking-token-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)] aria-disabled:pointer-events-none aria-disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  );
}

export function ButtonAnchor({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  children,
  ...props
}: ButtonAnchorProps) {
  return (
    <a
      className={cn(
        'inline-flex items-center justify-center gap-2 border font-ui font-semibold tracking-token-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)] aria-disabled:pointer-events-none aria-disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </a>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: Extract<ButtonVariant, 'outline' | 'ghost' | 'secondary' | 'primary'>;
}

const iconSizeClasses = {
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'md', variant = 'ghost', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)] disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        iconSizeClasses[size],
        className
      )}
      {...props}
    />
  )
);

IconButton.displayName = 'IconButton';

export const UnstyledButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)] disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
));

UnstyledButton.displayName = 'UnstyledButton';
