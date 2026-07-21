import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import type { LinkProps } from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex touch-manipulation items-center justify-center gap-2 border font-ui font-semibold tracking-token-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent-primary)] disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'border-accent bg-accent text-inverse hover:bg-accent-hover hover:border-accent-hover',
        secondary: 'border-transparent bg-surface-soft text-primary hover:bg-surface-hover',
        outline: 'border-border-subtle bg-surface text-primary hover:bg-primary hover:text-inverse',
        ghost: 'border-transparent bg-transparent text-primary hover:bg-surface-soft',
        danger: 'border-danger bg-danger-bg text-error hover:bg-surface-paper',
        accent: 'border-accent bg-accent text-inverse hover:bg-accent-hover hover:border-accent-hover',
        pdp: 'border-accent bg-accent text-inverse hover:bg-accent-hover hover:border-accent-hover w-full',
        success: 'border-success bg-success-bg text-success hover:bg-surface-paper',
        compact: 'border-border-subtle bg-surface-soft text-primary hover:bg-border-subtle hover:border-border-subtle text-body-xs py-1 px-3',
        inline: 'border-transparent bg-transparent text-accent hover:text-accent-hover underline underline-offset-2 p-0 h-auto',
        categoryOverlay: 'border-[rgba(var(--ds-white-rgb),0.3)] bg-[rgba(var(--ds-white-rgb),0.15)] text-inverse hover:bg-[rgba(var(--ds-white-rgb),0.25)] backdrop-blur-sm',
        'product-card': 'border-border-subtle bg-surface text-primary hover:bg-surface-soft hover:border-border-subtle text-body-xs',
        chip: 'rounded-full border-border-subtle bg-surface-paper text-secondary hover:border-primary hover:bg-parchment hover:text-primary normal-case',
        chipSelected:
          "rounded-full border-primary bg-parchment text-primary normal-case before:inline-block before:h-[0.58rem] before:w-[0.34rem] before:mt-[-0.12rem] before:rotate-45 before:border-b-[1.5px] before:border-r-[1.5px] before:border-current before:content-['']",
        pagination:
          'h-[var(--ds-control-sm)] w-[var(--ds-control-sm)] rounded-[var(--ds-radius-md)] border-border-subtle bg-surface-paper text-secondary hover:bg-parchment hover:text-primary',
        paginationSelected:
          'h-[var(--ds-control-sm)] w-[var(--ds-control-sm)] rounded-[var(--ds-radius-md)] border-primary bg-surface-paper text-primary',
      },
      size: {
        sm: 'min-h-[var(--ds-control-sm)] px-[var(--ds-space-xs)] text-body-xs',
        md: 'min-h-[var(--ds-control-md)] px-[var(--ds-space-md)] text-body-xs',
        lg: 'min-h-[var(--ds-control-lg)] px-[var(--ds-space-lg)] text-body-sm',
        iconSm: 'h-[var(--ds-control-icon-sm)] w-[var(--ds-control-icon-sm)]',
        iconMd: 'h-[var(--ds-control-icon-md)] w-[var(--ds-control-icon-md)]',
        iconLg: 'h-[var(--ds-control-icon-lg)] w-[var(--ds-control-icon-lg)]',
        none: '',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

interface ButtonLinkProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>,
    VariantProps<typeof buttonVariants> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

interface ButtonAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement>, VariantProps<typeof buttonVariants> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
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
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
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
  variant,
  size,
  fullWidth,
  leadingIcon,
  trailingIcon,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
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
  variant,
  size,
  fullWidth,
  leadingIcon,
  trailingIcon,
  children,
  ...props
}: ButtonAnchorProps) {
  return (
    <a
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      {...props}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </a>
  );
}

interface IconButtonProps extends Omit<ButtonProps, 'size'> {
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'md', variant = 'ghost', type = 'button', ...props }, ref) => {
    // Map size to iconSize variants
    const iconSize = size === 'sm' ? 'iconSm' : size === 'md' ? 'iconMd' : 'iconLg';
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size: iconSize, className }))}
        {...props}
      />
    );
  }
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
