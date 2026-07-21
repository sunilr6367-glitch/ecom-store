import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PageWidth = 'home' | 'standard' | 'narrow' | 'flush';
export type SurfaceRole = 'page' | 'paper' | 'soft' | 'dark';
export type HeadingRole = 'hero' | 'page' | 'section' | 'card';
export type TextRole = 'body' | 'label' | 'metadata' | 'price';

const widthClasses: Record<PageWidth, string> = {
  home: 'max-w-[var(--ds-home-content-width)]',
  standard: 'max-w-[var(--ds-page-width)]',
  narrow: 'max-w-[var(--ds-narrow-width)]',
  flush: 'max-w-none',
};

const surfaceClasses: Record<SurfaceRole, string> = {
  page: 'bg-surface text-primary',
  paper: 'bg-surface-paper text-primary',
  soft: 'bg-surface-soft text-primary',
  dark: 'bg-primary text-inverse',
};

export interface PageShellProps extends HTMLAttributes<HTMLElement> {
  surface?: SurfaceRole;
}

export function PageShell({ className, surface = 'page', ...props }: PageShellProps) {
  return <div data-page-shell className={cn('min-h-screen', surfaceClasses[surface], className)} {...props} />;
}

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  width?: PageWidth;
}

export function PageContainer({ className, width = 'standard', ...props }: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-[var(--ds-home-gutter-mobile)] md:px-[var(--ds-home-gutter-tablet)] lg:px-[var(--ds-home-gutter-desktop)]',
        widthClasses[width],
        className,
      )}
      {...props}
    />
  );
}

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions, className, ...props }: PageHeaderProps) {
  return (
    <header className={cn('py-[var(--ds-space-xl)] md:py-[var(--ds-space-2xl)]', className)} {...props}>
      {eyebrow ? <Text role="metadata">{eyebrow}</Text> : null}
      <Heading role="page" className={eyebrow ? 'mt-[var(--ds-space-xs)]' : undefined}>{title}</Heading>
      {description ? <Text className="mt-[var(--ds-space-sm)] max-w-prose text-secondary">{description}</Text> : null}
      {actions ? <div className="mt-[var(--ds-space-md)]">{actions}</div> : null}
    </header>
  );
}

const headingClasses: Record<HeadingRole, string> = {
  hero: 'font-display text-display-xl font-normal leading-token-tight tracking-token-normal',
  page: 'font-display text-display-lg font-normal leading-token-tight tracking-token-normal',
  section: 'font-display text-display-md font-normal leading-token-tight tracking-token-normal',
  card: 'font-body text-body-md font-medium leading-token-snug tracking-token-normal',
};

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  role: HeadingRole;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export function Heading({ role, as, className, ...props }: HeadingProps) {
  const Component = (as ?? (role === 'hero' || role === 'page' ? 'h1' : role === 'section' ? 'h2' : 'h3')) as ElementType;
  return <Component className={cn(headingClasses[role], className)} {...props} />;
}

const textClasses: Record<TextRole, string> = {
  body: 'font-body text-body-md leading-token-relaxed',
  label: 'font-ui text-body-sm font-medium leading-token-normal tracking-token-wide',
  metadata: 'font-ui text-body-xs font-medium leading-token-normal tracking-token-wider',
  price: 'font-body text-body-md font-semibold leading-token-normal tabular-nums',
};

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  role?: TextRole;
  as?: 'p' | 'span' | 'div';
}

export function Text({ role = 'body', as = 'p', className, ...props }: TextProps) {
  const Component = as as ElementType;
  return <Component className={cn(textClasses[role], className)} {...props} />;
}

export function Stack({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-[var(--ds-space-md)]', className)} {...props} />;
}

export function Cluster({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-wrap items-center gap-[var(--ds-space-xs)]', className)} {...props} />;
}

export function ScrollRail({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex snap-x snap-mandatory gap-[var(--ds-card-gap-mobile)] overflow-x-auto lg:gap-[var(--ds-card-gap)]', className)} {...props} />;
}

type EditorialMediaVariant = 'campaign' | 'collection' | 'journal';
const editorialMediaClasses: Record<EditorialMediaVariant, string> = {
  campaign: 'ds-editorial-media-campaign',
  collection: 'ds-editorial-media-collection bg-surface-soft',
  journal: 'ds-editorial-media-journal',
};

export function EditorialMedia({ variant, as = 'section', className, ...props }: HTMLAttributes<HTMLElement> & { variant: EditorialMediaVariant; as?: 'section' | 'div' }) {
  const Component = as as ElementType;
  return <Component className={cn('relative overflow-hidden', editorialMediaClasses[variant], className)} {...props} />;
}

type MediaOverlayVariant = 'strong' | 'soft' | 'card' | 'pattern';
const mediaOverlayClasses: Record<MediaOverlayVariant, string> = {
  strong: 'ds-media-overlay-strong', soft: 'ds-media-overlay-soft', card: 'ds-media-overlay-card', pattern: 'ds-media-overlay-pattern opacity-5',
};
export function MediaOverlay({ variant, className, ...props }: HTMLAttributes<HTMLDivElement> & { variant: MediaOverlayVariant }) {
  return <div aria-hidden className={cn('absolute inset-0', mediaOverlayClasses[variant], className)} {...props} />;
}
