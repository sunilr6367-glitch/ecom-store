import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  width?: 'default' | 'wide' | 'narrow';
}

const widthClasses = {
  default: 'max-w-page',
  wide: 'max-w-[1600px]',
  narrow: 'max-w-[var(--ds-narrow-width)]',
};

export function Section({ className, width = 'default', children, ...props }: SectionProps) {
  return (
    <section className={cn('py-[var(--ds-space-lg)] md:py-[var(--ds-space-xl)] lg:py-[var(--ds-space-2xl)]', className)} {...props}>
      <div className={cn('mx-auto px-[var(--ds-home-gutter-mobile)] md:px-[var(--ds-home-gutter-tablet)] lg:px-[var(--ds-home-gutter-desktop)]', widthClasses[width])}>
        {children}
      </div>
    </section>
  );
}

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  heading: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function SectionHeader({
  heading,
  description,
  action,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between',
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        {/* eyebrow removed per user request */}
        <h2 className="max-w-heading font-display text-display-md font-semibold leading-token-tight text-primary">
          {heading}
        </h2>
        {description ? (
          <p className="mt-4 max-w-prose font-body text-body-lg leading-token-relaxed text-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
