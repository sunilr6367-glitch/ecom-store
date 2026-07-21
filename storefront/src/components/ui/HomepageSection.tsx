import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const homepageContainerClassName =
  'mx-auto w-full max-w-[var(--ds-home-content-width)] px-[var(--ds-home-gutter-mobile)] md:px-[var(--ds-home-gutter-tablet)] lg:px-[var(--ds-home-gutter-desktop)]';

export const homepageSectionSpacingClassName =
  'py-16 md:py-24';

export const homepageScrollRailClassName = cn(
  homepageContainerClassName,
  'flex overflow-x-auto no-scrollbar scroll-smooth'
);

export const homepageSectionActionClassName =
  'inline-flex min-h-[var(--ds-control-sm)] items-center text-body-sm font-medium tracking-[0.1em] uppercase text-secondary transition-colors hover:text-primary';

type ContainerProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

export function HomepageContainer<T extends ElementType = 'div'>({
  as,
  className,
  children,
  ...props
}: ContainerProps<T>) {
  const Component = as || 'div';

  return (
    <Component className={cn(homepageContainerClassName, className)} {...props}>
      {children}
    </Component>
  );
}

interface HomepageSectionProps extends ComponentPropsWithoutRef<'section'> {
  contentClassName?: string;
}

export function HomepageSection({
  className,
  contentClassName,
  children,
  ...props
}: HomepageSectionProps) {
  return (
    <section className={cn(homepageSectionSpacingClassName, className)} {...props}>
      <HomepageContainer className={contentClassName}>{children}</HomepageContainer>
    </section>
  );
}

interface HomepageSectionHeaderProps extends ComponentPropsWithoutRef<'div'> {
  heading: ReactNode;
  headingId?: string;
  eyebrow?: ReactNode;
  action?: ReactNode;
  description?: ReactNode;
  align?: 'start' | 'center';
  headingClassName?: string;
}

export function HomepageSectionHeader({
  heading,
  headingId,
  eyebrow,
  action,
  description,
  align = 'start',
  className,
  headingClassName,
  ...props
}: HomepageSectionHeaderProps) {
  const centered = align === 'center';

  return (
    <div
      className={cn(
        'mb-[var(--ds-space-lg)] flex flex-col gap-[var(--ds-space-sm)] lg:mb-[var(--ds-space-2xl)]',
        centered
          ? 'items-center text-center'
          : 'justify-between md:flex-row md:items-end md:text-left',
        className
      )}
      {...props}
    >
      <div className={cn('min-w-0', centered && 'max-w-[var(--ds-prose-width)]')}>
        {eyebrow ? (
          <p className="mb-[var(--ds-space-xs)] font-label text-body-xs font-[var(--ds-type-label-weight)] tracking-[var(--ds-type-label-tracking)] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={headingId}
          className={cn(
            'font-display text-display-lg text-primary',
            centered ? 'mx-auto' : '',
            headingClassName
          )}
        >
          {heading}
        </h2>
        {description ? (
          <p className="mt-[var(--ds-space-sm)] text-body-md leading-token-relaxed text-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className={cn('shrink-0', centered && 'self-center')}>{action}</div> : null}
    </div>
  );
}
