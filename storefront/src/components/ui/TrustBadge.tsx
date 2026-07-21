import type { ComponentType, HTMLAttributes } from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustBadgeProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ComponentType<{ size?: number; className?: string }>;
  label: string;
  description?: string;
}

export function TrustBadge({
  icon: Icon = ShieldCheck,
  label,
  description,
  className,
  ...props
}: TrustBadgeProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 border border-border-subtle bg-surface-paper p-4 text-primary',
        className
      )}
      {...props}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center bg-accent-soft text-accent">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <strong className="block font-body text-body-sm font-semibold leading-token-snug">
          {label}
        </strong>
        {description ? (
          <span className="mt-1 block text-body-xs leading-token-normal text-muted">
            {description}
          </span>
        ) : null}
      </span>
    </div>
  );
}
