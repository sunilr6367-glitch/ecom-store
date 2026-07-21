import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StatusBannerTone = 'info' | 'success' | 'warning' | 'danger';

interface StatusBannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: StatusBannerTone;
  icon?: ReactNode;
  title?: ReactNode;
  children: ReactNode;
}

const toneClasses: Record<StatusBannerTone, string> = {
  info:
    'border-[var(--ds-info)] bg-[var(--ds-info-bg)] text-[var(--ds-info-text)]',
  success:
    'border-[var(--ds-success)] bg-[var(--ds-success-bg)] text-success',
  warning:
    'border-[var(--ds-warning)] bg-[var(--ds-warning-bg)] text-[var(--ds-warning-text)]',
  danger:
    'border-[var(--ds-danger)] bg-[var(--ds-danger-bg)] text-error',
};

export function StatusBanner({
  tone = 'info',
  icon,
  title,
  children,
  className,
  ...props
}: StatusBannerProps) {
  return (
    <div
      className={cn(
        'flex gap-[var(--ds-space-xs)] border px-[var(--ds-space-sm)] py-[var(--ds-space-xs)] font-body text-body-sm leading-token-relaxed',
        toneClasses[tone],
        className
      )}
      role={tone === 'danger' ? 'alert' : 'status'}
      {...props}
    >
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <div className="min-w-0">
        {title ? (
          <p className="mb-1 font-semibold text-primary">{title}</p>
        ) : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
