'use client';

import { ShieldCheck, Lock, CreditCard } from 'lucide-react';

interface SecurityBadgesProps {
  className?: string;
}

export default function SecurityBadges({
  className = '',
}: SecurityBadgesProps) {
  return (
    <div className={`flex items-center justify-center gap-[var(--ds-space-md)] py-[var(--ds-space-sm)] ${className}`}>
      {/* SSL Secure */}
      <div className="flex items-center gap-2 text-muted">
        <Lock size={16} className="text-success" />
        <span className="text-body-xs font-medium">SSL Secure</span>
      </div>

      {/* PCI Compliant */}
      <div className="flex items-center gap-2 text-muted">
        <CreditCard size={16} className="text-success" />
        <span className="text-body-xs font-medium">PCI Compliant</span>
      </div>

      {/* Authenticity */}
      <div className="flex items-center gap-2 text-muted">
        <ShieldCheck size={16} className="text-success" />
        <span className="text-body-xs font-medium">Authenticity Guaranteed</span>
      </div>
    </div>
  );
}

// Payment Icons Component
export function PaymentIcons({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-[var(--ds-space-xs)] ${className}`}>
      {/* Visa */}
      <div className="flex h-8 w-12 items-center justify-center rounded border border-border-subtle bg-surface-paper">
        <span className="text-body-xs text-info-text font-bold italic">
          VISA
        </span>
      </div>

      {/* Mastercard */}
      <div className="flex h-8 w-12 items-center justify-center rounded border border-border-subtle bg-surface-paper">
        <div className="flex items-center gap-0.5">
          <div className="h-4 w-4 rounded-full bg-danger"></div>
          <div className="-ml-2 h-4 w-4 rounded-full bg-footer-highlight"></div>
        </div>
      </div>

      {/* Amex */}
      <div className="flex h-8 w-12 items-center justify-center rounded border border-border-subtle bg-surface-paper">
        <span className="text-body-xs text-info-text font-bold">
          AMEX
        </span>
      </div>

      {/* PayPal */}
      <div className="flex h-8 w-14 items-center justify-center rounded border border-border-subtle bg-surface-paper">
        <span className="text-body-xs text-info-text font-bold">
          PayPal
        </span>
      </div>

      {/* Apple Pay */}
      <div className="flex h-8 w-10 items-center justify-center rounded bg-primary">
        <span className="text-body-xs text-inverse font-medium">Pay</span>
      </div>
    </div>
  );
}


