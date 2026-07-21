'use client';

import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function Surface({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={clsx(
        'rounded-[1.35rem] border border-[var(--kv-border)] bg-[var(--kv-card)] shadow-[0_18px_44px_rgba(26,26,26,0.04)]',
        className
      )}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2 md:flex-row md:items-end md:justify-between md:px-8">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--kv-accent-deep)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-[var(--font-display)] text-[2.35rem] leading-none text-[var(--kv-text)] md:text-[3rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--kv-muted)] md:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </div>
  );
}

export function ActionButton({
  href,
  onClick,
  icon: Icon,
  children,
  variant = 'primary',
}: {
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const className = clsx(
    'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold',
    variant === 'primary' &&
      'bg-[var(--kv-accent)] text-white hover:bg-[var(--kv-accent-deep)]',
    variant === 'secondary' &&
      'border border-[var(--kv-border)] bg-white text-[var(--kv-text)] hover:bg-[var(--kv-soft)]',
    variant === 'danger' &&
      'bg-[var(--kv-danger)] text-white hover:bg-[#a62f23]'
  );

  const content = (
    <>
      {Icon ? <Icon size={16} /> : null}
      {children}
    </>
  );

  if (href) {
    const isExternal = href.startsWith('http') || href.startsWith('mailto:');

    if (isExternal) {
      return (
        <a
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noreferrer' : undefined}
          className={className}
        >
          {content}
        </a>
      );
    }

    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
}) {
  const toneClasses = {
    default: 'bg-[var(--kv-card)]',
    accent: 'bg-[var(--kv-accent-soft)]',
    success: 'bg-[#edf7f1]',
    warning: 'bg-[#fbf3e0]',
    danger: 'bg-[#faebe9]',
  }[tone];

  return (
    <Surface className={clsx('p-5 md:p-6', toneClasses)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold text-[var(--kv-text)] md:text-[2rem]">
            {value}
          </p>
          {hint ? (
            <p className="mt-2 text-sm text-[var(--kv-muted)]">{hint}</p>
          ) : null}
        </div>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--kv-accent-deep)]">
          <Icon size={20} />
        </span>
      </div>
    </Surface>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const normalized = status.toLowerCase();
  const statusClasses =
    {
      pending: 'bg-[#fbf3e0] text-[var(--kv-warning)]',
      processing: 'bg-[#edf4fb] text-[#2f6db0]',
      shipped: 'bg-[#f1ecfb] text-[#6f42c1]',
      delivered: 'bg-[#edf7f1] text-[var(--kv-success)]',
      completed: 'bg-[#edf7f1] text-[var(--kv-success)]',
      cancelled: 'bg-[#faebe9] text-[var(--kv-danger)]',
      canceled: 'bg-[#faebe9] text-[var(--kv-danger)]',
      draft: 'bg-[#fbf3e0] text-[var(--kv-warning)]',
      published: 'bg-[#edf7f1] text-[var(--kv-success)]',
      archived: 'bg-[var(--kv-soft)] text-[var(--kv-muted)]',
      active: 'bg-[#edf7f1] text-[var(--kv-success)]',
      inactive: 'bg-[var(--kv-soft)] text-[var(--kv-muted)]',
    }[normalized] || 'bg-[var(--kv-soft)] text-[var(--kv-text)]';

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
        statusClasses,
        className
      )}
    >
      {normalized.replaceAll('_', ' ')}
    </span>
  );
}

export function SegmentedTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ label: string; value: T; count?: number }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={clsx(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium',
              active
                ? 'border-[var(--kv-accent)] bg-[var(--kv-accent-soft)] text-[var(--kv-accent-deep)]'
                : 'border-[var(--kv-border)] bg-white text-[var(--kv-muted)] hover:text-[var(--kv-text)]'
            )}
          >
            {option.label}
            {typeof option.count === 'number' ? (
              <span
                className={clsx(
                  'inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                  active
                    ? 'bg-white text-[var(--kv-accent-deep)]'
                    : 'bg-[var(--kv-soft)] text-[var(--kv-muted)]'
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function QuickActionCard({
  title,
  subtitle,
  href,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-[1.2rem] border border-[var(--kv-border)] bg-white px-4 py-4 shadow-[0_14px_30px_rgba(26,26,26,0.03)] transition hover:border-[var(--kv-accent)]/45 hover:bg-[var(--kv-accent-soft)]"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--kv-soft)] text-[var(--kv-accent-deep)]">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-[var(--kv-text)]">{title}</p>
          <p className="text-xs text-[var(--kv-muted)]">{subtitle}</p>
        </div>
      </div>
      <ArrowUpRight
        size={16}
        className="text-[var(--kv-muted)] transition group-hover:text-[var(--kv-accent-deep)]"
      />
    </Link>
  );
}

export function SectionHeader({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--kv-border)] px-5 py-4 md:px-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--kv-text)]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--kv-muted)]">{description}</p>
        ) : null}
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--kv-accent-deep)]"
        >
          {actionLabel}
          <ChevronRight size={16} />
        </Link>
      ) : null}
    </div>
  );
}
